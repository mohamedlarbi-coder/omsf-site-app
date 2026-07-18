import React from "react";

const AREAS = [
  { label: "AREA 1", sub: "Control Rooms", left: "8%", top: "35%" },
  { label: "AREA 2", sub: "Duct Bank", left: "31%", top: "63%" },
  { label: "AREA 3", sub: "Deep Pits", left: "50%", top: "34%" },
  { label: "AREA 4", sub: "Buggy Pits", left: "65%", top: "63%" },
  { label: "AREA 5", sub: "Train Wash", left: "79%", top: "37%" },
];

/* Visual area overview. Currently a static list of the OMSF areas —
   not yet wired to the real site-map image/pin data used elsewhere
   in the app (that's a follow-up integration, not fake data shown
   as if it were live). */
export default function DashboardProjectMap({ onViewFullMap }) {
  return (
    <div style={{ background: "#0d1b26", border: "1px solid rgba(160, 190, 204, 0.14)", borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>Project Map</div>
        <button onClick={onViewFullMap} style={{ background: "none", border: "none", color: "#18C9CB", fontSize: 12, cursor: "pointer" }}>View full map ›</button>
      </div>
      <div
        style={{
          position: "relative",
          height: 140,
          backgroundColor: "#08131D",
          backgroundImage:
            "linear-gradient(rgba(24,213,208,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(24,213,208,0.06) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {AREAS.map((a) => (
          <div key={a.label} style={{ position: "absolute", left: a.left, top: a.top, transform: "translate(-50%, -50%)" }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#17C9C6",
                boxShadow: "0 0 7px rgba(23, 201, 198, 0.55)",
                margin: "0 auto 4px",
              }}
            />
            <div
              style={{
                background: "linear-gradient(180deg, rgba(8,127,128,0.82), rgba(4,79,83,0.88))",
                border: "1px solid rgba(26, 213, 211, 0.58)",
                borderRadius: 9,
                padding: "6px 10px",
                boxShadow: "0 0 13px rgba(14, 197, 197, 0.18)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ color: "#DFFFFF", fontSize: 11, fontWeight: 700 }}>{a.label}</div>
              <div style={{ color: "#B9E1E1", fontSize: 9.5, marginTop: 2 }}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
