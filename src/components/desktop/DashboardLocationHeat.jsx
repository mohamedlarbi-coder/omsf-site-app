import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import HeatMapCanvas from "./HeatMapCanvas";
import { heatColor, isValidPin } from "../../lib/heatmap";
import { BUILDING_OPTIONS_BY_SITE } from "../../lib/constants";

/* ---------------------------------------------------------------------------
   "Where hazards concentrate" — two views of the same live reports:

     Site-wide   density heat map on the real site map, from each report's
                 dropped pin (report.map_pin).
     Buildings   one tile per building / area, coloured on the same cold→hot
                 scale by how many reports name it as their location.

   Both come from reports filed in the app. The monthly GSH report carries no
   location, so history from before the app cannot appear here.
--------------------------------------------------------------------------- */

const panel = {
  background: "#0d1b26",
  border: "1px solid rgba(160,190,204,0.14)",
  borderRadius: 14,
  padding: 16,
  minWidth: 0,
};

const normLoc = (s) => (s || "").replace(/\s+/g, " ").trim();

function BuildingTiles({ reports }) {
  const { tiles, max, unlocated } = useMemo(() => {
    const counts = new Map();
    // Known buildings always get a tile, so an untouched one reads as "0"
    // rather than being absent.
    Object.values(BUILDING_OPTIONS_BY_SITE).flat().forEach((b) => counts.set(b, 0));

    let unlocated = 0;
    reports.forEach((r) => {
      const loc = normLoc(r.location);
      if (!loc) { unlocated += 1; return; }
      counts.set(loc, (counts.get(loc) || 0) + 1);
    });

    const tiles = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return { tiles, max: Math.max(1, ...tiles.map((t) => t.count)), unlocated };
  }, [reports]);

  const total = tiles.reduce((a, t) => a + t.count, 0);

  if (total === 0) {
    return (
      <div style={{ color: "#8A9198", fontSize: 12.5, padding: "28px 8px", textAlign: "center", lineHeight: 1.5 }}>
        No located reports yet. Each report's building / area counts here as it is filed.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {tiles.map((t, i) => {
          const intensity = t.count === 0 ? 0 : Math.max(0.2, t.count / max);
          return (
            <div
              key={t.name}
              style={{
                position: "relative",
                borderRadius: 10,
                padding: "12px 12px 10px",
                background: "#08131D",
                border: "1px solid rgba(160,190,204,0.12)",
                overflow: "hidden",
              }}
            >
              {t.count > 0 && (
                <div style={{ position: "absolute", inset: 0, background: heatColor(intensity), opacity: 0.55 }} />
              )}
              <div style={{ position: "relative" }}>
                <div style={{ color: "#F0F4F6", fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{t.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                  <span style={{ color: t.count === 0 ? "#5C6870" : "#FFFFFF", fontSize: 22, fontWeight: 700 }}>{t.count}</span>
                  <span style={{ color: "#B8C2C8", fontSize: 11 }}>
                    {t.count > 0 ? `${Math.round((t.count / total) * 100)}%` : ""}
                  </span>
                </div>
                {i === 0 && t.count > 0 && (
                  <div style={{ marginTop: 6, color: "#FFE9B8", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Most affected
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {unlocated > 0 && (
        <div style={{ marginTop: 10, color: "#5C6870", fontSize: 10.5 }}>
          {unlocated} report{unlocated === 1 ? "" : "s"} with no location are not shown.
        </div>
      )}
    </>
  );
}

export default function DashboardLocationHeat({ reports = [], siteMapUrl, site = "RSSOM" }) {
  const scoped = useMemo(
    () => (site === "RSSOM" ? reports : reports.filter((r) => r.site === site)),
    [reports, site]
  );
  const points = useMemo(
    () => scoped.filter((r) => isValidPin(r.map_pin)).map((r) => r.map_pin),
    [scoped]
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", gap: 14 }}>
      <div style={panel}>
        <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700 }}>Site-wide</div>
        <div style={{ color: "#8A9198", fontSize: 11, margin: "2px 0 10px" }}>
          {points.length > 0
            ? `Hazard density from ${points.length} pinned report${points.length === 1 ? "" : "s"}`
            : "No pinned reports yet"}
        </div>

        <div style={{ position: "relative", height: 300, background: "#08131D", borderRadius: 10, overflow: "hidden" }}>
          {siteMapUrl ? (
            <img
              src={siteMapUrl}
              alt="Site map"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.8 }}
              draggable={false}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#5C6870" }}>
              <MapPin size={22} />
              <span style={{ fontSize: 12 }}>No site map uploaded yet</span>
            </div>
          )}
          <HeatMapCanvas points={points} renderWidth={900} renderHeight={300} />
        </div>

        {points.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 10, color: "#8A9198" }}>Fewer</span>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "linear-gradient(90deg, #188CC6, #18C9C6, #E0A80F, #DC2626)" }} />
            <span style={{ fontSize: 10, color: "#8A9198" }}>More</span>
          </div>
        )}
      </div>

      <div style={panel}>
        <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700 }}>Buildings</div>
        <div style={{ color: "#8A9198", fontSize: 11, margin: "2px 0 10px" }}>
          Reports per building / area — hottest first
        </div>
        <BuildingTiles reports={scoped} />
      </div>
    </div>
  );
}
