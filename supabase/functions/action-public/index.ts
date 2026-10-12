// action-public: token-based API behind the personal email links (/a/<token>).
// No login: the token itself identifies the action and the role (sub | safety).
// Ops: get | submit (sub) | review (safety: reviewed | close | send_back).
import { admin, addBusinessDays, cors, ensureLinks, emailHtml, esc, jsonRes, linkUrl, plain, prettyDate, sendEmail, torontoToday } from "./shared.ts";

const PHOTO_REQUIRED = ["Hazard", "Closecall"];

// deno-lint-ignore no-explicit-any
function reportRows(rep: any, role: string, due?: string | null): [string, string][] {
  return [
    ["Report Type", rep.report_type || "—"],
    ["Location", [rep.site, rep.location].filter(Boolean).join(" — ") || "—"],
    ["Risk Rating", rep.risk_rating || "—"],
    ["Reported", rep.report_date || "—"],
    // Subcontractors only ever see the company, never a person's name.
    [role === "sub" ? "Reported by" : "Submitted by", role === "sub" ? (rep.company || "—") : (rep.respondent || rep.company || "—")],
    ...(due ? [["Due", prettyDate(due)] as [string, string]] : []),
    ["Issue", rep.description || "—"],
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json();
    const { token, op } = body;
    if (!token || typeof token !== "string") return jsonRes({ error: "bad_request" }, 400);
    const sb = admin();

    const { data: link } = await sb.from("action_links").select("role, expires_at, action_id").eq("token", token).maybeSingle();
    if (!link) return jsonRes({ error: "invalid_link" }, 404);
    if (new Date(link.expires_at) < new Date()) return jsonRes({ error: "expired" }, 410);

    const { data: action } = await sb.from("action_items").select("*").eq("id", link.action_id).single();
    const { data: rep } = await sb.from("reports").select("*").eq("id", action.report_id).single();
    const role = link.role as "sub" | "safety";
    const links = await ensureLinks(sb, action.id);

    const loadEvents = async () => (await sb.from("action_events").select("kind, note, photo_url, actor, created_at").eq("action_id", action.id).order("created_at")).data || [];

    if (op === "get") {
      return jsonRes({
        role,
        action: { id: action.id, status: action.status, due_date: action.due_date, subcontractor: action.subcontractor, location: action.location, correction_submitted_at: action.correction_submitted_at },
        report: {
          report_type: rep.report_type, site: rep.site, location: rep.location, risk_rating: rep.risk_rating,
          description: rep.description, safety_concern: rep.safety_concern, report_date: rep.report_date,
          corrective_action: rep.corrective_action, photo: rep.photo_data_url || null,
          by: role === "sub" ? (rep.company || "") : (rep.respondent || rep.company || ""),
          company: rep.company || "",
        },
        events: await loadEvents(),
        photoRequired: PHOTO_REQUIRED.includes(rep.report_type),
      });
    }

    const actor = role === "sub" ? (action.subcontractor || "Subcontractor") : "Safety team";
    const addEvent = (kind: string, note = "", photo_url: string | null = null) =>
      sb.from("action_events").insert({ action_id: action.id, kind, note, photo_url, actor });
    const loc = rep.location || "OMSF";

    /* ---- Subcontractor submits the correction ---- */
    if (op === "submit") {
      if (role !== "sub") return jsonRes({ error: "forbidden" }, 403);
      if (action.status === "Closed") return jsonRes({ error: "closed" }, 409);
      const note = String(body.note || "").trim().slice(0, 2000);
      const photo = typeof body.photo === "string" ? body.photo : "";
      if (note.length < 3) return jsonRes({ error: "needs_note" }, 400);
      if (PHOTO_REQUIRED.includes(rep.report_type) && !photo) return jsonRes({ error: "needs_photo" }, 400);

      let photoUrl: string | null = null;
      if (photo) {
        const m = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
        if (!m || m[2].length > 8_000_000) return jsonRes({ error: "bad_photo" }, 400);
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
        const path = `${action.id}/${Date.now()}.${ext}`;
        const up = await sb.storage.from("corrections").upload(path, bytes, { contentType: m[1] });
        if (up.error) { console.error(up.error); return jsonRes({ error: "upload_failed" }, 500); }
        photoUrl = sb.storage.from("corrections").getPublicUrl(path).data.publicUrl;
      }

      await sb.from("action_items").update({
        status: "Correction submitted", correction_submitted_at: new Date().toISOString(),
        reminder_count: 0, last_reminder_sent_at: null, escalation_pending: false,
      }).eq("id", action.id);
      await addEvent("correction_submitted", note, photoUrl);

      const url = linkUrl(links.safety);
      await sendEmail({
        to: action.safety_emails || [],
        subject: `[MINERVIUM] Correction submitted — ${loc}`,
        text: plain([`A correction was submitted by ${action.subcontractor || "the subcontractor"} for: ${rep.report_type} — ${loc}.`, "", `What was done: ${note}`, "", `Review it here: ${url}`]),
        html: emailHtml({
          banner: { label: "Correction submitted", text: `<b>${esc(action.subcontractor || "The subcontractor")}</b> submitted a correction. Please review it.`, tone: "amber" },
          intro: "A corrective action is waiting for your review.",
          rows: reportRows(rep, "safety", action.due_date),
          quote: { label: `${action.subcontractor || "Subcontractor"} says`, text: note },
          imageUrl: photoUrl || undefined,
          button: { label: "Review correction", url, note: "Verify & close, or send it back with a comment." },
        }),
      });
      return jsonRes({ ok: true });
    }

    /* ---- Safety team reviews ---- */
    if (op === "review") {
      if (role !== "safety") return jsonRes({ error: "forbidden" }, 403);
      if (action.status === "Closed") return jsonRes({ error: "closed" }, 409);
      const decision = body.decision;
      const comment = String(body.comment || "").trim().slice(0, 2000);

      if (decision === "reviewed") {
        if (action.status === "Open") {
          await sb.from("action_items").update({ status: "Reviewed", reviewed_at: new Date().toISOString() }).eq("id", action.id);
        }
        await addEvent("reviewed", comment);
        return jsonRes({ ok: true });
      }

      if (decision === "close") {
        const evs = await loadEvents();
        const last = [...evs].reverse().find((e) => e.kind === "correction_submitted");
        await sb.from("action_items").update({
          status: "Closed", closed_at: new Date().toISOString(),
          closure_notes: last?.note || comment || "", closure_photo_url: last?.photo_url || null,
          escalation_pending: false,
        }).eq("id", action.id);
        await addEvent("closed", comment);
        const mk = (r: "sub" | "safety") => emailHtml({
          banner: { label: "Closed · verified", text: "The corrective action was verified by the safety team.", tone: "green" },
          intro: r === "sub" ? "Thank you — this item is now closed." : "This item is now closed.",
          rows: reportRows(rep, r),
          imageUrl: last?.photo_url || undefined,
        });
        const subj = `[MINERVIUM] Closed — ${loc}`;
        await sendEmail({ to: action.safety_emails || [], subject: subj, text: `Closed and verified: ${rep.report_type} — ${loc}.`, html: mk("safety") });
        await sendEmail({ to: action.sub_emails || [], subject: subj, text: `Closed and verified: ${rep.report_type} — ${loc}. Thank you.`, html: mk("sub") });
        return jsonRes({ ok: true });
      }

      if (decision === "send_back") {
        if (comment.length < 3) return jsonRes({ error: "needs_comment" }, 400);
        const requested = typeof body.new_due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.new_due_date) ? body.new_due_date : null;
        const today = torontoToday();
        const due = requested && requested >= today ? requested : addBusinessDays(today, 1);
        await sb.from("action_items").update({ status: "Open", due_date: due, reminder_count: 0, last_reminder_sent_at: null, escalation_pending: false }).eq("id", action.id);
        await addEvent("sent_back", comment);
        const url = linkUrl(links.sub);
        await sendEmail({
          to: action.sub_emails || [],
          subject: `[MINERVIUM] Sent back — more information needed — ${loc}`,
          text: plain(["The safety team sent this back:", comment, "", `New due date: ${prettyDate(due)}`, `Open the corrective action: ${url}`]),
          html: emailHtml({
            banner: { label: "Sent back", text: `Please update the correction by <b>${esc(prettyDate(due))}</b>.`, tone: "red" },
            intro: "The safety team reviewed your correction and needs something more.",
            quote: { label: "Safety team comment", text: comment },
            rows: reportRows(rep, "sub", due),
            button: { label: "Open corrective action", url, note: "No login needed — add a photo and a short note." },
          }),
        });
        return jsonRes({ ok: true });
      }
      return jsonRes({ error: "bad_decision" }, 400);
    }

    return jsonRes({ error: "bad_op" }, 400);
  } catch (err) {
    console.error(err);
    return jsonRes({ error: "server_error" }, 500);
  }
});
