import React from "react";

/* Donut + legend for a per-trade breakdown. Trades with 0 stay in the legend. */
export default function TradePie({ title, subtitle, data, centerLabel = "Total", onSelect, selected }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  const R = 60;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  const segs = data.map((d) => {
    const dash = total ? (d.count / total) * CIRC : 0;
    const seg = { ...d, dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ flex: 1, minWidth: 0, background: "#0d1b26", border: "1px solid rgba(160,190,204,0.14)", borderRadius: 16, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "#8A9198", margin: "2px 0 0" }}>{subtitle}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
        <svg width={150} height={150} viewBox="0 0 150 150" style={{ flexShrink: 0 }}>
          <g transform="translate(75,75) rotate(-90)">
            <circle r={R} fill="none" stroke="#1c2b38" strokeWidth={16} />
            {segs.filter((s) => s.count > 0).map((s) => (
              <circle key={s.name} r={R} fill="none" stroke={s.color} strokeWidth={16}
                strokeDasharray={`${s.dash} ${CIRC - s.dash}`} strokeDashoffset={-s.offset} />
            ))}
          </g>
          <text x="75" y="76" textAnchor="middle" fontSize="26" fontWeight="700" fill="#FFFFFF">{total}</text>
          <text x="75" y="94" textAnchor="middle" fontSize="11" fill="#8A9198">{centerLabel}</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 140, flex: 1 }}>
          {data.map((d) => {
            const clickable = !!onSelect;
            const active = selected === d.name;
            return (
              <div
                key={d.name}
                onClick={clickable ? () => onSelect(active ? null : d.name) : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 8, fontSize: 12.5,
                  color: d.count === 0 ? "#6B7780" : "#D5D8DC",
                  cursor: clickable ? "pointer" : "default",
                  padding: "2px 6px", margin: "0 -6px", borderRadius: 6,
                  background: active ? "rgba(24,201,203,0.12)" : "transparent",
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 3, background: d.count === 0 ? "#2a3a46" : d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                <span style={{ color: d.count === 0 ? "#6B7780" : "#FFFFFF", fontWeight: 600 }}>{d.count}</span>
                <span style={{ color: "#6B7780", width: 34, textAlign: "right" }}>{total ? `${Math.round((d.count / total) * 100)}%` : "0%"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
