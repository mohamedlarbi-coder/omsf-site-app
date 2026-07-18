import React from "react";
import { Eye, ShieldCheck, Users, TrendingUp } from "lucide-react";

function KPICard({ icon: Icon, label, value, delta }) {
  return (
    <div
      style={{
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

/* Total Observations comes from real report data. Closed Actions,
   Participants and Safety Improvement are placeholder figures —
   Actions and Users/participation tracking aren't real features yet. */
export default function DashboardKPICards({ totalObservations }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
      <KPICard icon={Eye} label="Total Observations" value={totalObservations} delta="+18 this week" />
      <KPICard icon={ShieldCheck} label="Closed Actions" value="96" delta="+24 this week" />
      <KPICard icon={Users} label="Participants" value="254" delta="+32 this week" />
      <KPICard icon={TrendingUp} label="Safety Improvement" value="78%" delta="+12% vs last month" />
    </div>
  );
}
