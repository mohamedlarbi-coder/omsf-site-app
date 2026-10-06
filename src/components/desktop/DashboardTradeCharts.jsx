import React, { useEffect, useMemo, useState } from "react";
import TradePie from "./TradePie";
import { supabase } from "../../supabaseClient";
import { countByTrade, tradeOfReport, tradeOfAction } from "../../lib/trades";

/* Two pies side by side: reports per trade and actions per trade. Every
   subcontractor in the list is shown, with 0 when nothing is connected to it. */
export default function DashboardTradeCharts({ reports = [], subcontractors = [], actions: actionsProp, onOpenActions }) {
  const [actions, setActions] = useState(actionsProp || []);
  useEffect(() => {
    if (actionsProp) return;
    supabase.from("action_items").select("id,subcontractor,status").then(({ data }) => setActions(data || []));
  }, [actionsProp]);

  const names = useMemo(() => subcontractors.map((s) => s.name), [subcontractors]);
  const reportData = useMemo(() => countByTrade(names, reports, tradeOfReport), [names, reports]);
  const openActions = useMemo(() => actions.filter((a) => a.status === "Open"), [actions]);
  const actionData = useMemo(() => countByTrade(names, openActions, tradeOfAction), [names, openActions]);

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
      <TradePie title="Reports by Trade" subtitle="Reports connected to each subcontractor" data={reportData} centerLabel="Reports" />
      <TradePie title="Open Actions by Trade" subtitle="Click a trade to see its actions" data={actionData} centerLabel="Open"
        onSelect={onOpenActions ? (name) => onOpenActions(name) : undefined} />
    </div>
  );
}
