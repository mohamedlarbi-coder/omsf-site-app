import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import HeatMapCanvas from "./HeatMapCanvas";
import { isValidPin } from "../../lib/heatmap";

/* Dashboard-widget-sized hazard density heat map — a real overlay on the
   team's uploaded site map, built from every report's dropped pin
   (report.map_pin, set in ObservationMapPicker). See lib/heatmap.js for
   the rendering technique and DashboardProjectMapPage for the full-screen
   version this links to via "View full map". */
export default function DashboardProjectMap({ reports = [], siteMapUrl, onViewFullMap }) {
  const points = useMemo(
    () => reports.filter((r) => isValidPin(r.map_pin)).map((r) => r.map_pin),
    [reports]
  );

  return (
    <div style={{ background: "#0d1b26", border: "1px solid rgba(160, 190, 204, 0.14)", borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>Project Map</div>
          <div style={{ fontSize: 11, color: "#8A9198", marginTop: 2 }}>
            {points.length > 0
              ? `Hazard density from ${points.length} pinned report${points.length === 1 ? "" : "s"}`
              : "No pinned reports yet"}
          </div>
        </div>
        <button onClick={onViewFullMap} style={{ background: "none", border: "none", color: "#18C9CB", fontSize: 12, cursor: "pointer" }}>
          View full map ›
        </button>
      </div>

      <div style={{ position: "relative", height: 180, backgroundColor: "#08131D", borderRadius: 10, overflow: "hidden" }}>
        {siteMapUrl ? (
          <img
            src={siteMapUrl}
            alt="Site map"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(24,213,208,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(24,213,208,0.06) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
        )}

        <HeatMapCanvas points={points} />

        {!siteMapUrl && (
          <div
            style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6, color: "#5C6870",
            }}
          >
            <MapPin size={20} />
            <span style={{ fontSize: 11.5 }}>No site map uploaded yet</span>
          </div>
        )}

        {siteMapUrl && points.length === 0 && (
          <div
            style={{
              position: "absolute", left: 10, bottom: 10, right: 10,
              background: "rgba(8,19,29,0.7)", borderRadius: 8, padding: "6px 10px",
              color: "#8A9198", fontSize: 10.5, textAlign: "center",
            }}
          >
            Heat will build up here as crews pin hazards on the map when filing reports.
          </div>
        )}
      </div>

      {points.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "#8A9198" }}>Fewer</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "linear-gradient(90deg, #188CC6, #18C9C6, #E0A80F, #DC2626)" }} />
          <span style={{ fontSize: 10, color: "#8A9198" }}>More</span>
        </div>
      )}
    </div>
  );
}
