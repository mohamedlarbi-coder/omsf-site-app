import React from "react";

const TYPE_COLORS = {
  "Good Spot": "#12C4C7",
  "Hazard": "#247FC8",
  "Closecall": "#E5A01E",
  "OFI": "#8C969D",
};
const TYPE_LABELS = {
  "Good Spot": "Good Spot",
  "Hazard": "Hazard",
  "Closecall": "Close Call",
  "OFI": "OFI",
};

/* Donut chart computed from real report_type counts across all
   reports — no placeholder data here, this reflects the actual log. */
export default function DashboardDonutChart({ reports }) {
  const counts = { "Good Spot": 0, "Hazard": 0, "Closecall": 0, "OFI": 0 };
  reports.forEach((r) => { if (counts[r.report_type] !== undefined) counts[r.report_type]++; });
  const total = reports.length || 1;

  const R = 60;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  const segments = Object.entries(counts).map(([type, count]) => {
    const pct = count / total;
    const seg = { type, count, pct, dash: pct * CIRC, offset };
    offset += pct * CIRC;
    return seg;
  });

  return (
    <div style={{ flex: 1, background: "#0d1b26", border: "1px solid rgba(160, 190, 204, 0.14)", borderRadius: 16, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", marginBottom: 16 }}>Observations by Type</div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width={150} height={150} viewBox="0 0 150 150">
          <g transform="translate(75,75) rotate(-90)">
            <circle r={R} fill="none" stroke="#1c2b38" strokeWidth={16} />
            {segments.map((s) => (
              <circle
                key={s.type}
                r={R}
                fill="none"
                stroke={TYPE_COLORS[s.type]}
                strokeWidth={16}
                strokeDasharray={`${s.dash} ${CIRC - s.dash}`}
                strokeDashoffset={-s.offset}
              />
            ))}
          </g>
          <text x="75" y="70" textAnchor="middle" fontSize="26" fontWeight="700" fill="#FFFFFF">{reports.length}</text>
          <text x="75" y="90" textAnchor="middle" fontSize="11" fill="#8A9198">Total</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {segments.map((s) => (
            <div key={s.type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#D5D8DC" }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: TYPE_COLORS[s.type] }} />
              {TYPE_LABELS[s.type]} <span style={{ color: "#8A9198" }}>{s.count} ({Math.round(s.pct * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
