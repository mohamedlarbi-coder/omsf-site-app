import React, { useState } from "react";
import { Check, Send, Copy, Loader2 } from "lucide-react";
import { buildReportEmail } from "../lib/constants";
import { supabase } from "../supabaseClient";
import BackgroundWatermark from "./BackgroundWatermark";

export default function SendPromptView({ profile, pendingSendReport, setPendingSendReport, setView, subcontractors = [], showToast }) {
  const [extraEmail, setExtraEmail] = useState("");
  const [sending, setSending] = useState(false);

  if (!pendingSendReport) {
    setView("log");
    return null;
  }

  // Same matching logic as buildReportEmail: a subcontractor tied to
  // this report via either "Action Report To" or the "Subcontractor"
  // field gets their contact emails shown here before sending.
  const resolvedSubcontractorName =
    pendingSendReport.subcontractor === "Others" ? pendingSendReport.subcontractor_other : pendingSendReport.subcontractor;
  const namesToMatch = [pendingSendReport.action_report_to, resolvedSubcontractorName]
    .filter(Boolean)
    .map((n) => n.trim().toLowerCase());
  const matchedSubs = subcontractors.filter((s) => namesToMatch.includes(s.name.trim().toLowerCase()));

  function getRecipients() {
    const baseEmails = (profile.distribution_list || "").split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    const subEmails = matchedSubs.flatMap((s) => s.contact_emails || []);
    const extra = extraEmail.trim() ? [extraEmail.trim()] : [];
    return [...new Set([...baseEmails, ...subEmails, ...extra])];
  }

  function getLink() {
    return buildReportEmail(pendingSendReport, profile, subcontractors, extraEmail.trim() ? [extraEmail.trim()] : []);
  }

  // Sends the email automatically in the background via the
  // send-report-email Edge Function — no Gmail/Outlook window opens.
  // Requires that function to be deployed with a Resend API key
  // configured (see supabase/functions/send-report-email/index.ts).
  async function sendNow() {
    const to = getRecipients();
    if (to.length === 0) {
      showToast && showToast("No recipients — add an email or set your distribution list first");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-report-email", {
        body: { to, report: pendingSendReport, profile },
      });
      if (error || data?.error) {
        showToast && showToast("Couldn't send automatically — try 'Copy Email Content' instead");
      } else {
        showToast && showToast("Report emailed automatically");
      }
    } catch (err) {
      showToast && showToast("Couldn't send automatically — try 'Copy Email Content' instead");
    }
    setSending(false);
    setPendingSendReport(null);
    setView("log");
  }

  async function copyContent() {
    try {
      const link = getLink();
      const url = new URL(link);
      const to = decodeURIComponent(url.pathname);
      const subject = decodeURIComponent(url.searchParams.get("subject") || "");
      const body = decodeURIComponent(url.searchParams.get("body") || "");
      const text = `To: ${to}\nSubject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(text);
      showToast && showToast("Copied — paste it into any email app");
    } catch (err) {
      showToast && showToast("Couldn't copy — try again");
    }
  }

  function skip() {
    setPendingSendReport(null);
    setView("log");
  }

  return (
    <div className="min-h-screen bg-[#08131D] font-sans flex flex-col relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-10 text-center relative z-10">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-5">
          <Check size={28} className="text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Report saved</h1>
        <p className="text-sm text-slate-400 mb-6">
          Send it to the safety manager now? The app will email it automatically — no other app opens.
        </p>

        <div className="bg-[#0d1b26] rounded-xl border border-slate-800 p-4 text-left mb-6 space-y-3">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Base Distribution List</div>
            <div className="text-sm text-slate-200 break-words">{profile.distribution_list || "—"}</div>
          </div>
          {matchedSubs.map((sub) => (
            <div key={sub.name}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Also notifying: {sub.name}
              </div>
              <div className="text-sm text-slate-200 break-words">
                {(sub.contact_emails || []).join(", ") || "No emails on file"}
              </div>
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Add a specific email (optional)
            </label>
            <input
              type="email"
              value={extraEmail}
              onChange={(e) => setExtraEmail(e.target.value)}
              placeholder="someone@company.com"
              className="w-full rounded-lg border border-slate-700 bg-[#08131D] text-white px-3 py-2.5 text-[14px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <button
          onClick={sendNow}
          disabled={sending}
          className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 mb-3"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {sending ? "Sending…" : "Send Automatically"}
        </button>
        <button
          onClick={copyContent}
          className="w-full border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 hover:bg-white/5"
        >
          <Copy size={16} /> Copy Email Content Instead
        </button>
        <button onClick={skip} className="w-full text-slate-400 font-medium py-2 text-sm">
          Skip for now
        </button>
      </div>
    </div>
  );
}
