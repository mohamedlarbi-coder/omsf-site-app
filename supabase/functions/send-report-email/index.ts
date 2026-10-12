// send-report-email: sends the MINERVIUM report notification via Resend (sender: reports@minerviumlabs.com).
// - Safety team / distribution list: HTML + PDF + a "Review report" button (personal link).
// - Subcontractor contacts: a separate email with the company name only (no personal names),
//   due date, and an "Open corrective action" button (personal link, no login).
// Reports without a corrective action item (e.g. Good Spot) get the plain single email.
import { admin, cors, ensureLinks, emailHtml, esc, jsonRes, linkUrl, plain, prettyDate, sendEmail } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { to, safetyTo, subTo, report, profile, pdfBase64, pdfFilename } = await req.json();
    const subList: string[] = [...new Set((subTo || []) as string[])];
    const allSafety: string[] = (safetyTo || to || []) as string[];
    const safetyList = [...new Set(allSafety)].filter((e) => !subList.includes(e));
    if (!safetyList.length && !subList.length) return jsonRes({ error: "No recipients provided" }, 400);

    const dateTime = new Date(report.created_at || Date.now()).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
    const submitter = profile?.my_name || report.respondent || "—";
    const loc = report.location || "OMSF";
    const sb = admin();

    // Is there a corrective action to track for this report?
    let action = null;
    if (report.id) {
      const { data } = await sb.from("action_items").select("*").eq("report_id", report.id).eq("kind", "Corrective").maybeSingle();
      action = data;
    }

    const baseRows = (role: "safety" | "sub"): [string, string][] => [
      ["Report Type", report.report_type || "—"],
      ["Project", report.project || "—"],
      ["Area/Location", report.location || "—"],
      [role === "sub" ? "Reported by" : "Submitted By", role === "sub" ? (report.company || "—") : submitter],
      ...(role === "safety" ? [["Company", report.company || "—"] as [string, string]] : []),
      ["Date and Time", dateTime],
      ["Risk Rating", report.risk_rating || "—"],
      ...(action?.due_date ? [["Due", prettyDate(action.due_date)] as [string, string]] : []),
      ["Status", action?.status || report.status || "Open"],
    ];
    const attachments = pdfBase64 ? [{ filename: pdfFilename || `Report_${report.report_date || "report"}.pdf`, content: pdfBase64 }] : [];
    const subject = `[MINERVIUM] ${report.report_type || "Safety"} Report — ${loc}`;

    // ---- Legacy path: nothing to track ----
    if (!action) {
      const r = await sendEmail({
        to: [...safetyList, ...subList], subject,
        text: plain([
          "Hello,", "", "A new safety report has been submitted through the MINERVIUM Safety Application.", "",
          ...baseRows("safety").map(([k, v]) => `* ${k}: ${v}`), "",
          "Please find the complete safety report attached.", "", "MINERVIUM Safety — Observe • Share • Prevent • Improve",
        ]),
        html: emailHtml({
          intro: "A new safety report has been submitted through the <b>MINERVIUM Safety Application</b>.",
          rows: baseRows("safety"),
          after: ["Please find the complete safety report attached, including the observation details, photographs, contributing factors, and any recommended corrective or preventive actions."],
        }),
        attachments,
      });
      return r.ok ? jsonRes({ sent: true }) : jsonRes({ error: "send_failed" }, 500);
    }

    // ---- Tracked path ----
    const links = await ensureLinks(sb, action.id);
    await sb.from("action_items").update({ loop_enabled: true, safety_emails: safetyList, sub_emails: subList }).eq("id", action.id);
    const { count } = await sb.from("action_events").select("id", { count: "exact", head: true }).eq("action_id", action.id).eq("kind", "reported");
    if (!count) await sb.from("action_events").insert({ action_id: action.id, kind: "reported", actor: report.company || "" });

    const safetyUrl = linkUrl(links.safety);
    const results: boolean[] = [];
    if (safetyList.length) {
      const r = await sendEmail({
        to: safetyList, subject,
        text: plain([
          "Hello,", "", "A new safety report has been submitted through the MINERVIUM Safety Application.", "",
          ...baseRows("safety").map(([k, v]) => `* ${k}: ${v}`), "",
          `Review the report and the corrective action: ${safetyUrl}`, "",
          "MINERVIUM Safety — Observe • Share • Prevent • Improve",
        ]),
        html: emailHtml({
          intro: "A new safety report has been submitted through the <b>MINERVIUM Safety Application</b>.",
          rows: baseRows("safety"),
          button: { label: "Review report", url: safetyUrl, note: "Mark it reviewed, then verify the correction when the subcontractor submits it." },
          after: [
            "The complete report is attached, including the observation details, photographs and contributing factors.",
            "Please review it and take the required action. The responsible subcontractor has been asked to submit a correction with a photo.",
          ],
        }),
        attachments,
      });
      results.push(r.ok);
    }
    if (subList.length) {
      const subUrl = linkUrl(links.sub);
      const r = await sendEmail({
        to: subList,
        subject: `[MINERVIUM] Corrective action required — ${loc}`,
        text: plain([
          "Hello,", "", `A safety observation involving ${action.subcontractor || "your company"} needs a corrective action.`, "",
          ...baseRows("sub").map(([k, v]) => `* ${k}: ${v}`),
          report.description ? `* Issue: ${report.description}` : "", "",
          `Open the corrective action (no login needed): ${subUrl}`, "", "MINERVIUM Safety",
        ]),
        html: emailHtml({
          banner: { label: "Corrective action required", text: action.due_date ? `Please submit your correction by <b>${esc(prettyDate(action.due_date))}</b>.` : "Please submit your correction.", tone: "amber" },
          intro: `A safety observation involving <b>${esc(action.subcontractor || "your company")}</b> needs a corrective action. Please fix the issue and confirm it with a photo using the button below.`,
          rows: [...baseRows("sub"), ["Issue", report.description || "—"]],
          button: { label: "Open corrective action", url: subUrl, note: "No login needed — add a photo and a short note from your phone." },
          footnote: "Reminders are sent each business day until the correction is submitted. This is an automated notification from the MINERVIUM Safety Application.",
        }),
      });
      results.push(r.ok);
    }
    return results.every(Boolean) ? jsonRes({ sent: true }) : jsonRes({ error: "send_failed" }, 500);
  } catch (err) {
    console.error(err);
    return jsonRes({ error: String(err) }, 500);
  }
});
