import React from "react";
import { Check, Send } from "lucide-react";
import { buildReportEmail } from "../lib/constants";

export default function SendPromptView({ profile, pendingSendReport, setPendingSendReport, setView, subcontractors = [] }) {
  if (!pendingSendReport) {
    setView("log");
    return null;
  }

  const matchedSub = subcontractors.find(
    (s) => s.name.trim().toLowerCase() === (pendingSendReport.action_report_to || "").trim().toLowerCase()
  );

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
    <div className="min-h-screen bg-stone-100 font-sans flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <Check size={28} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-stone-800 mb-2">Report saved</h1>
        <p className="text-sm text-stone-500 mb-6">
          Send it to the safety manager now? Your mail app will open with everything pre-filled.
        </p>

        <div className="bg-white rounded-xl border border-stone-200 p-4 text-left mb-6 space-y-3">
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Base Distribution List</div>
            <div className="text-sm text-stone-700 break-words">{profile.distribution_list || "—"}</div>
          </div>
          {matchedSub && (
            <div>
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                Also notifying: {matchedSub.name}
              </div>
              <div className="text-sm text-stone-700 break-words">
                {(matchedSub.contact_emails || []).join(", ") || "No emails on file"}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={sendNow}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 mb-3"
        >
          <Send size={18} /> Open Email to Send
        </button>
        <button onClick={skip} className="w-full text-stone-500 font-medium py-2 text-sm">
          Skip for now
        </button>
      </div>
    </div>
  );
}
