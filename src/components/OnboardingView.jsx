import React, { useState } from "react";
import { Send, Check, Loader2 } from "lucide-react";
import SentiQLogo from "./SentiQLogo";

export default function OnboardingView({ profile, updateMyProfile, setView, showToast }) {
  const [distributionList, setDistributionList] = useState(profile.distribution_list || "");
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!distributionList.trim()) {
      showToast("Add at least one email to continue");
      return;
    }
    setSaving(true);
    await updateMyProfile({ distribution_list: distributionList });
    setSaving(false);
    setView("log");
  }

  return (
    <div className="min-h-screen bg-[#050b14] font-sans flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-10">
        <div className="text-center mb-8">
          <SentiQLogo size={72} />
          <h1 className="text-xl font-bold text-white mt-4">Welcome to SentiQ</h1>
          <p className="text-slate-400 text-sm mt-2 px-4">
            Before your first report, set up where your reports should be sent — for example, your safety manager's email.
          </p>
        </div>

        <div className="bg-[#0b1522] border border-teal-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
            <Send size={16} className="text-teal-400" /> Base Distribution List
          </div>
          <textarea
            value={distributionList}
            onChange={(e) => setDistributionList(e.target.value)}
            placeholder="safety.manager@company.com, hse.team@company.com"
            rows={4}
            className="w-full rounded-lg border border-slate-700 bg-[#050b14] text-white px-3 py-2.5 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
          <p className="text-xs text-slate-400">
            Every report you submit will go to these emails by default. Separate multiple addresses with commas. You can also add specific subcontractor contacts later in Settings — those get added automatically based on who you select as "Report To" on each report.
          </p>
        </div>

        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full mt-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-60 text-white font-bold tracking-wide py-3.5 rounded-xl flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          Save & Continue
        </button>

        <button onClick={() => setView("log")} className="w-full text-slate-500 font-medium py-3 text-sm mt-1 hover:text-slate-300 transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  );
}
