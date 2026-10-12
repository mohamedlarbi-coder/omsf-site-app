// send-action-reminders: runs on weekdays (pg_cron). For corrective actions in the
// closed loop (loop_enabled) that are past due: up to 3 reminders, one per business day,
// to the subcontractor and the safety team (each with their own link). If a correction is
// waiting for review, only the safety team is reminded. After 3 reminders: escalation flag only.
import { admin, businessDaysOverdue, cors, emailHtml, ensureLinks, esc, jsonRes, linkUrl, plain, prettyDate, sendEmail, torontoToday } from "./shared.ts";

const MAX_REMINDERS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = admin();
    const today = torontoToday();
    const dow = new Date(today + "T00:00:00Z").getUTCDay();
    if (dow === 0 || dow === 6) return jsonRes({ skipped: "weekend" });

    const { data: items, error } = await sb.from("action_items").select("*")
      .eq("loop_enabled", true).eq("kind", "Corrective").neq("status", "Closed")
      .eq("escalation_pending", false).not("due_date", "is", null).lt("due_date", today);
    if (error) throw error;

    let sent = 0, escalated = 0;
    for (const a of items || []) {
      const lastDay = a.last_reminder_sent_at
        ? new Date(a.last_reminder_sent_at).toLocaleDateString("en-CA", { timeZone: "America/Toronto" }) : null;
      if (lastDay === today) continue;

      if ((a.reminder_count || 0) >= MAX_REMINDERS) {
        await sb.from("action_items").update({ escalation_pending: true }).eq("id", a.id);
        await sb.from("action_events").insert({ action_id: a.id, kind: "escalation_pending", note: "3 reminders sent without resolution", actor: "System" });
        escalated++;
        continue;
      }

      const n = (a.reminder_count || 0) + 1;
      const late = businessDaysOverdue(a.due_date, today);
      const { data: rep } = await sb.from("reports").select("report_type, site, location, risk_rating, company, description").eq("id", a.report_id).single();
      if (!rep) continue;
      const links = await ensureLinks(sb, a.id);
      const loc = rep.location || "OMSF";
      const waiting = a.status === "Correction submitted";
      const rowsFor = (role: "sub" | "safety"): [string, string][] => [
        ["Report Type", rep.report_type || "—"],
        ["Location", [rep.site, rep.location].filter(Boolean).join(" — ") || "—"],
        ["Risk Rating", rep.risk_rating || "—"],
        ["Was due", prettyDate(a.due_date)],
        ["Subcontractor", a.subcontractor || "—"],
        ...(role === "sub" ? [["Reported by", rep.company || "—"] as [string, string]] : []),
        ["Issue", rep.description || "—"],
      ];
      const banner = {
        label: `Reminder ${n} of ${MAX_REMINDERS} · ${waiting ? "Review pending" : "Corrective action overdue"}`,
        text: `${late} business day${late === 1 ? "" : "s"} overdue.`,
        tone: "red" as const,
      };
      const subject = `[MINERVIUM] Reminder ${n}/${MAX_REMINDERS} — ${waiting ? "review pending" : "overdue"} — ${loc}`;

      if (!waiting) {
        const url = linkUrl(links.sub);
        await sendEmail({
          to: a.sub_emails || [], subject,
          text: plain([`Reminder ${n} of ${MAX_REMINDERS}: corrective action overdue at ${loc}.`, `Open: ${url}`]),
          html: emailHtml({ banner, intro: "This corrective action has passed its deadline and is still open.", rows: rowsFor("sub"), button: { label: "Open corrective action", url, note: "No login needed — add a photo and a short note." } }),
        });
      }
      const surl = linkUrl(links.safety);
      await sendEmail({
        to: a.safety_emails || [], subject,
        text: plain([`Reminder ${n} of ${MAX_REMINDERS}: ${waiting ? "a correction is waiting for review" : "corrective action overdue"} at ${loc}.`, `Open: ${surl}`]),
        html: emailHtml({ banner, intro: waiting ? "A submitted correction is waiting for your review." : "This corrective action has passed its deadline and is still open.", rows: rowsFor("safety"), button: { label: waiting ? "Review correction" : "Open item", url: surl } }),
      });

      await sb.from("action_items").update({ reminder_count: n, last_reminder_sent_at: new Date().toISOString() }).eq("id", a.id);
      await sb.from("action_events").insert({ action_id: a.id, kind: "reminder", note: `Reminder ${n} of ${MAX_REMINDERS}`, actor: "System" });
      sent++;
    }
    return jsonRes({ sent, escalated, checked: (items || []).length });
  } catch (err) {
    console.error(err);
    return jsonRes({ error: "server_error" }, 500);
  }
});
