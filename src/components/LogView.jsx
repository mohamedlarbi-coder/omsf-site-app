import React, { useState } from "react";
import { Settings, BarChart3, Sparkles, ClipboardList, Loader2, Image as ImageIcon, Mail } from "lucide-react";
import { riskBarInfo } from "../lib/constants";
import SentiQLogo from "./SentiQLogo";
import BackgroundWatermark from "./BackgroundWatermark";

export default function LogView({ profile, profiles, reports, setView, setActiveReport, showToast }) {
  const [filter, setFilter] = useState("all");

  const visibleReports = filter === "mine" ? reports.filter((r) => r.author_id === profile.id) : reports;

  function authorName(report) {
    const p = profiles.find((p) => p.id === report.author_id);
    return p?.my_name || report.respondent || "Unknown";
  }

  return (
    <div className="min-h-screen bg-[#050b14] font-sans relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto pb-28 relative z-10">
        <header className="bg-[#0b1522] border-b border-teal-500/20 text-white px-5 pt-7 pb-6 rounded-b-3xl shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <SentiQLogo size={22} />
              <span className="text-teal-400 text-xs font-bold tracking-widest uppercase">SentiQ · OMSF Site</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setView("stats")} className="p-1.5 rounded-full hover:bg-white/10 text-slate-300">
                <BarChart3 size={18} />
              </button>
              <button onClick={() => setView("settings")} className="p-1.5 rounded-full hover:bg-white/10 text-slate-300">
                <Settings size={18} />
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Good Spot / Hazard Log</h1>
          <p className="text-slate-300 text-sm mt-1">{profile.my_name || "Unnamed"}</p>
          <p className="text-slate-500 text-xs mt-2">{reports.length} report{reports.length !== 1 ? "s" : ""} logged across the site</p>
        </header>

        <div className="px-4 mt-5">
          {!profile.distribution_list && (
            <button
              onClick={() => setView("settings")}
              className="w-full mb-4 flex items-center gap-3 bg-[#0b1522] border border-teal-500/30 rounded-xl px-4 py-3 text-left"
            >
              <Mail size={20} className="text-teal-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-teal-300">Set up your distribution list</div>
                <div className="text-xs text-slate-400 mt-0.5">So reports reach the safety manager automatically</div>
              </div>
            </button>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg border ${filter === "all" ? "bg-teal-600 border-teal-600 text-white" : "bg-[#0b1522] border-slate-700 text-slate-400"}`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg border ${filter === "mine" ? "bg-teal-600 border-teal-600 text-white" : "bg-[#0b1522] border-slate-700 text-slate-400"}`}
            >
              My Reports
            </button>
          </div>

          {visibleReports.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                <ClipboardList size={28} className="text-teal-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">No reports yet</h3>
              <p className="text-sm text-slate-400">
                {filter === "mine" ? "You haven't logged any reports yet." : "Tap the button below to log a hazard, good spot, or close call."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReports.map((r) => {
                const typeColors = {
                  Hazard: "bg-red-500/15 text-red-400",
                  "Good Spot": "bg-emerald-500/15 text-emerald-400",
                  OFI: "bg-blue-500/15 text-blue-400",
                  Closecall: "bg-orange-500/15 text-orange-400",
                };
                const riskColor = r.risk_rating ? riskBarInfo(r.risk_rating).color : null;
                return (
                  <button
                    key={r.id}
                    onClick={() => { setActiveReport(r); setView("detail"); }}
                    className="w-full bg-[#0b1522] rounded-xl border border-slate-800 flex gap-3 text-left hover:border-teal-500/40 transition-colors overflow-hidden"
                  >
                    <div className="w-1.5 shrink-0" style={{ backgroundColor: riskColor || "#334155" }} />
                    <div className="flex gap-3 p-3 pl-0 flex-1 min-w-0">
                      {r.photo_data_url ? (
                        <img src={r.photo_data_url} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <ImageIcon size={20} className="text-slate-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeColors[r.report_type] || "bg-slate-700 text-slate-300"}`}>
                            {r.report_type}
                          </span>
                          {r.risk_rating && <span className="text-[11px] text-slate-500">{r.risk_rating}</span>}
                          {r.ai_generated && <Sparkles size={11} className="text-teal-400" />}
                        </div>
                        <div className="font-semibold text-sm text-white truncate">{r.location || "Untitled location"}</div>
                        <div className="text-xs text-slate-500 truncate">{authorName(r)} · {r.report_date}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setView("form")}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white
          font-bold px-6 py-3.5 rounded-full shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all"
      >
        <Sparkles size={18} /> New Report
      </button>
    </div>
  );
}
