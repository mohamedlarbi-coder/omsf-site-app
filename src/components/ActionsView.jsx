import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import MinerviumLogo from "./MinerviumLogo";
import BackgroundWatermark from "./BackgroundWatermark";
import TradePie from "./desktop/TradePie";
import { supabase } from "../supabaseClient";
import { countByTrade, tradeOfAction, tradeOfReport } from "../lib/trades";

/* Mobile Actions — the corrective / preventative actions created from reports,
   by trade. Every subcontractor is listed (0 when nothing is connected to it).
   Read-only here; closing an action out (with its photo) stays on desktop. */
const FILTERS = ["Open", "Overdue", "Closed", "All"];

function dueInfo(a) {
  if (a.status === "Closed") return { label: "Closed", color: "#1FC99B" };
  if (!a.due_date) return { label: "No due date", color: "#8A9198" };
  const days = Math.floor((Date.now() - new Date(a.due_date).getTime()) / 86400000);
  if (days > 0) return { label: `Overdue ${days}d`, color: "#E5484D" };
  return { label: `Due in ${-days}d`, color: "#E5A01E" };
}

export default function ActionsView({ reports = [], subcontractors = [], setView }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Open");
  const [trade, setTrade] = useState(null);

  useEffect(() => {
    supabase.from("action_items").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, []);

  const names = useMemo(() => subcontractors.map((s) => s.name), [subcontractors]);
  const byStatus = useMemo(() => items.filter((i) => {
    if (filter === "All") return true;
    if (filter === "Overdue") return i.status === "Open" && i.due_date && new Date(i.due_date) < new Date();
    return i.status === filter;
  }), [items, filter]);
  const actionData = useMemo(() => countByTrade(names, byStatus, tradeOfAction), [names, byStatus]);
  const reportData = useMemo(() => countByTrade(names, reports, tradeOfReport), [names, reports]);
  const list = trade ? byStatus.filter((i) => tradeOfAction(i) === trade) : byStatus;

  return (
    <div className="min-h-screen bg-[#08131D] font-sans relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto pb-28 relative z-10 px-5 pt-6">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setView("home")} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-slate-300">
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <MinerviumLogo size={40} showWordmark={false} showTagline={false} />
            <span className="text-teal-400 text-xs font-bold tracking-widest uppercase">Actions</span>
          </div>
          <div style={{ width: 28 }} />
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold border whitespace-nowrap ${filter === f ? "bg-teal-500/15 border-teal-500/40 text-teal-300" : "bg-[#0d1b26] border-slate-700 text-slate-400"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-5">
          <TradePie title="Actions by Trade" subtitle={`${filter} actions — tap a trade to filter`} data={actionData} centerLabel={filter} selected={trade} onSelect={setTrade} />
          <TradePie title="Reports by Trade" subtitle="Reports connected to each subcontractor" data={reportData} centerLabel="Reports" />
        </div>

        {trade && (
          <div className="mb-3 text-sm text-teal-300">
            Showing <b>{trade}</b>{" "}
            <button onClick={() => setTrade(null)} className="underline text-slate-400">show all</button>
          </div>
        )}

        <div className="bg-[#0d1b26] border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No {filter !== "All" ? filter.toLowerCase() : ""} actions{trade ? ` for ${trade}` : ""}.</div>
          ) : list.map((a, i) => {
            const due = dueInfo(a);
            return (
              <div key={a.id} className={`px-4 py-3.5 ${i !== list.length - 1 ? "border-b border-slate-800" : ""}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-teal-400">{a.kind}</span>
                  <span className="text-xs font-semibold" style={{ color: due.color }}>{due.label}</span>
                </div>
                <div className="text-white text-[14px] leading-snug">{a.description}</div>
                <div className="text-slate-500 text-xs mt-1.5">
                  {tradeOfAction(a)}{a.location ? ` · ${a.location}` : ""}{a.owner ? ` · ${a.owner}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
