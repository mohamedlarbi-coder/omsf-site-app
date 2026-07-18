import React from "react";
import { Check, Send } from "lucide-react";
import { buildReportEmail } from "../lib/constants";
import BackgroundWatermark from "./BackgroundWatermark";

export default function SendPromptView({ profile, pendingSendReport, setPendingSendReport, setView, subcontractors = [] }) {
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

  function sendNow() {
    const link = buildReportEmail(pendingSendReport, profile, subcontractors);
    window.open(link, "_blank");
    setPendingSendReport(null);
    setView("log");
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
          Send it to the safety manager now? Your mail app will open with everything pre-filled.
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
        </div>

        <button
          onClick={sendNow}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 mb-3"
        >
          <Send size={18} /> Open Email to Send
        </button>
        <button onClick={skip} className="w-full text-slate-400 font-medium py-2 text-sm">
          Skip for now
        </button>
      </div>
    </div>
  );
}
