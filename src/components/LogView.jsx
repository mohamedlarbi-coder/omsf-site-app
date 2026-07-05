import React, { useState } from "react";
import { Building2, Settings, BarChart3, Sparkles, ClipboardList, Loader2, Image as ImageIcon, Mail } from "lucide-react";
import { riskBarInfo } from "../lib/constants";

export default function LogView({ profile, profiles, reports, setView, setActiveReport, showToast }) {
  const [filter, setFilter] = useState("all");

  const visibleReports = filter === "mine" ? reports.filter((r) => r.author_id === profile.id) : reports;

  function authorName(report) {
    const p = profiles.find((p) => p.id === report.author_id);
    return p?.my_name || report.respondent || "Unknown";
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans">
      <div className="max-w-md mx-auto pb-28">
        <header className="bg-stone-800 text-white px-5 pt-7 pb-6 rounded-b-3xl shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold tracking-widest uppercase">
              <Building2 size={14} /> OMSF Site
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setView("stats")} className="p-1.5 rounded-full hover:bg-white/10 text-stone-300">
                <BarChart3 size={18} />
              </button>
              <button onClick={() => setView("settings")} className="p-1.5 rounded-full hover:bg-white/10 text-stone-300">
                <Settings size={18} />
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Good Spot / Hazard Log</h1>
          <p className="text-stone-300 text-sm mt-1">{profile.my_name || "Unnamed"}</p>
          <p className="text-stone-400 text-xs mt-2">{reports.length} report{reports.length !== 1 ? "s" : ""} logged across the site</p>
        </header>

        <div className="px-4 mt-5">
          {!profile.distribution_list && (
            <button
              onClick={() => setView("settings")}
              className="w-full mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left"
            >
              <Mail size={20} className="text-amber-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-amber-800">Set up your distribution list</div>
                <div className="text-xs text-amber-700 mt-0.5">So reports reach the safety manager automatically</div>
              </div>
            </button>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg border ${filter === "all" ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-stone-300 text-stone-600"}`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg border ${filter === "mine" ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-stone-300 text-stone-600"}`}
            >
              My Reports
            </button>
          </div>

          {visibleReports.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <ClipboardList size={28} className="text-violet-600" />
              </div>
              <h3 className="font-semibold text-stone-700 mb-1">No reports yet</h3>
              <p className="text-sm text-stone-400">
                {filter === "mine" ? "You haven't logged any reports yet." : "Tap the button below to log a hazard, good spot, or close call."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReports.map((r) => {
                const typeColors = {
                  Hazard: "bg-red-100 text-red-700",
                  "Good Spot": "bg-emerald-100 text-emerald-700",
                  OFI: "bg-blue-100 text-blue-700",
                  Closecall: "bg-orange-100 text-orange-700",
                };
                const riskColor = r.risk_rating ? riskBarInfo(r.risk_rating).color : null;
                return (
                  <button
                    key={r.id}
                    onClick={() => { setActiveReport(r); setView("detail"); }}
                    className="w-full bg-white rounded-xl border border-stone-200 flex gap-3 text-left hover:border-violet-300 transition-colors overflow-hidden"
                  >
                    <div className="w-1.5 shrink-0" style={{ backgroundColor: riskColor || "#e7e5e4" }} />
                    <div className="flex gap-3 p-3 pl-0 flex-1 min-w-0">
                      {r.photo_data_url ? (
                        <img src={r.photo_data_url} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                          <ImageIcon size={20} className="text-stone-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeColors[r.report_type] || "bg-stone-100 text-stone-600"}`}>
                            {r.report_type}
                          </span>
                          {r.risk_rating && <span className="text-[11px] text-stone-400">{r.risk_rating}</span>}
                          {r.ai_generated && <Sparkles size={11} className="text-violet-400" />}
                        </div>
                        <div className="font-semibold text-sm text-stone-800 truncate">{r.location || "Untitled location"}</div>
                        <div className="text-xs text-stone-400 truncate">{authorName(r)} · {r.report_date}</div>
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
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-violet-600 hover:bg-violet-700 text-white
          font-semibold px-6 py-3.5 rounded-full shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-colors"
      >
        <Sparkles size={18} /> New Report
      </button>
    </div>
  );
}
