import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Eye, ShieldCheck, Users, TrendingUp } from "lucide-react";

function KPICard({ icon: Icon, label, value, delta, onClick }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{
        cursor: onClick ? "pointer" : "default",
        flex: 1,
        background: "linear-gradient(145deg, rgba(14,31,42,0.98), rgba(10,25,35,0.98))",
        border: "1px solid rgba(121, 160, 177, 0.18)",
        borderRadius: 14,
        padding: "20px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "1px solid rgba(200, 217, 223, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={30} color="#17CDCE" strokeWidth={1.6} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.03em", color: "#ADB7BD", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 500, color: "#F4F7F8", marginTop: 6, lineHeight: 1 }}>{value}</div>
        {delta && <div style={{ fontSize: 11, fontWeight: 600, color: "#1FC99B", marginTop: 10 }}>{delta}</div>}
      </div>
    </div>
  );
}

/* Total Observations and Actions come from real data. Participants and
   Safety Improvement are still placeholder figures. */
export default function DashboardKPICards({ totalObservations, onOpenActions }) {
  const [actions, setActions] = useState([]);
  useEffect(() => {
    supabase.from("action_items").select("id,status,due_date").then(({ data }) => setActions(data || []));
  }, []);
  const open = actions.filter((a) => a.status === "Open");
  const overdue = open.filter((a) => a.due_date && new Date(a.due_date) < new Date()).length;
  const closed = actions.length - open.length;

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
      <KPICard icon={Eye} label="Total Observations" value={totalObservations} />
      <KPICard icon={ShieldCheck} label="Open Actions" value={open.length}
        delta={`${closed} closed${overdue ? ` · ${overdue} overdue` : ""} — view ›`} onClick={onOpenActions} />
      <KPICard icon={Users} label="Participants" value="254" delta="+32 this week" />
      <KPICard icon={TrendingUp} label="Safety Improvement" value="78%" delta="+12% vs last month" />
    </div>
  );
}
