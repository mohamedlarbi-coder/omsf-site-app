import React from "react";
import { ChevronLeft, BarChart3, ClipboardList, AlertTriangle, User } from "lucide-react";
import BackgroundWatermark from "./BackgroundWatermark";

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={18} className="text-teal-400" />}
      <h2 className="text-[15px] font-semibold tracking-wide text-white uppercase">{children}</h2>
    </div>
  );
}

export default function StatsView({ reports, profiles, setView }) {
  const total = reports.length;
  const byType = {};
  const byRisk = { "Very High/High": 0, Medium: 0, Low: 0, "No Risk": 0 };
  const byTracking = {};
  const byUser = {};

  reports.forEach((r) => {
    byType[r.report_type] = (byType[r.report_type] || 0) + 1;
    if (r.risk_rating) byRisk[r.risk_rating] = (byRisk[r.risk_rating] || 0) + 1;
    (r.tracking_types || []).forEach((t) => { byTracking[t] = (byTracking[t] || 0) + 1; });
    const authorName = profiles.find((p) => p.id === r.author_id)?.my_name || r.respondent || "Unknown";
    byUser[authorName] = (byUser[authorName] || 0) + 1;
  });

  const trackingSorted = Object.entries(byTracking).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxTracking = Math.max(1, ...trackingSorted.map(([, v]) => v));
  const userSorted = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxUser = Math.max(1, ...userSorted.map(([, v]) => v));

  const typeColors = { Hazard: "#dc2626", "Good Spot": "#16a34a", OFI: "#2563eb", Closecall: "#ea580c" };

  return (
    <div className="min-h-screen bg-[#050b14] font-sans relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto pb-10 relative z-10">
        <header className="sticky top-0 bg-[#0b1522] border-b border-slate-800 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView("log")} className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-800 text-slate-300">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-semibold text-white">Site Statistics</h1>
        </header>

        <div className="p-4 space-y-6">
          <div className="bg-[#0b1522] border border-teal-500/20 rounded-2xl p-5 text-white">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-slate-500 text-sm mt-0.5">Total reports across the Ontario Line site</div>
          </div>

          <div>
            <SectionTitle icon={BarChart3}>Risk Level Breakdown</SectionTitle>
            <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 space-y-3">
              {[
                { key: "No Risk", label: "Good", color: "#16a34a" },
                { key: "Low", label: "Low", color: "#eab308" },
                { key: "Medium", label: "Medium", color: "#eab308" },
                { key: "Very High/High", label: "High / Hazard", color: "#dc2626" },
              ].map((r) => {
                const count = byRisk[r.key] || 0;
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={r.key}>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{r.label}</span><span>{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <SectionTitle icon={ClipboardList}>Report Type</SectionTitle>
            <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 flex flex-wrap gap-2">
              {Object.entries(byType).length === 0 && <p className="text-sm text-slate-500">No data yet</p>}
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: typeColors[type] || "#78716c" }}>
                  {type} · {count}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle icon={AlertTriangle}>Hazard Trend (by Tracking Type)</SectionTitle>
            <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 space-y-2.5">
              {trackingSorted.length === 0 && <p className="text-sm text-slate-500">No data yet</p>}
              {trackingSorted.map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>{type}</span><span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${(count / maxTracking) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Shows which hazard categories come up most often across the site — useful for spotting recurring risks.
            </p>
          </div>

          <div>
            <SectionTitle icon={User}>Reports by Team Member</SectionTitle>
            <div className="bg-[#0b1522] rounded-xl border border-slate-800 p-4 space-y-2.5">
              {userSorted.length === 0 && <p className="text-sm text-slate-500">No data yet</p>}
              {userSorted.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>{name}</span><span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-400" style={{ width: `${(count / maxUser) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
