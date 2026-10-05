import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import HeatMapCanvas from "./HeatMapCanvas";
import { isValidPin } from "../../lib/heatmap";

const TYPE_BADGE = {
  "Good Spot": { bg: "#178F8C", color: "#D8FFFF" },
  Hazard: { bg: "#246DAE", color: "#DCEFFF" },
  Closecall: { bg: "#C98718", color: "#FFF2D4" },
  OFI: { bg: "#66737C", color: "#F0F3F4" },
};

/* Full-screen Project Map — the real site map with the hazard-density heat
   overlay (see lib/heatmap.js), plus a list of every pinned report so a
   cluster on the map can be traced back to the actual reports behind it.
   Linked from the dashboard widget's "View full map". */
export default function DashboardProjectMapPage({ profile, reports = [], siteMapUrl, setView, showToast, setActiveReport }) {
  const pinned = useMemo(
    () =>
      reports
        .filter((r) => isValidPin(r.map_pin))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [reports]
  );
  const points = useMemo(() => pinned.map((r) => r.map_pin), [pinned]);

  function handleSidebarNav(key) {
    if (key === "dashboard") setView("home");
    else if (key === "observations") setView("observations-desktop");
    else if (key === "actions") setView("actions-desktop");
    else if (key === "inspections") setView("inspections-desktop");
    else if (key === "analytics") setView("analytics-desktop");
    else if (key === "reports") setView("stats");
    else if (key === "settings") setView("settings");
    else showToast?.(`${key.charAt(0).toUpperCase() + key.slice(1)} isn't built yet — coming soon`);
  }

  function openReport(r) {
    setActiveReport(r);
    setView("detail");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08131D", display: "flex", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <DashboardSidebar active="dashboard" onNavigate={handleSidebarNav} profile={profile} />

      <div style={{ flex: 1, padding: "22px 28px 60px", minWidth: 0 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 650, color: "#F0F4F6" }}>Project Map</div>
          <div style={{ fontSize: 12.5, color: "#8997A1", marginTop: 4 }}>
            {points.length > 0
              ? `Hazard density from ${points.length} pinned report${points.length === 1 ? "" : "s"}`
              : "No pinned reports yet — heat builds up as crews pin hazards when filing reports"}
          </div>
        </div>

        <div style={{ background: "#0d1b26", border: "1px solid rgba(160,190,204,0.14)", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ position: "relative", height: 460, backgroundColor: "#08131D", borderRadius: 10, overflow: "hidden" }}>
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

            <HeatMapCanvas points={points} renderWidth={1100} renderHeight={460} />

            {!siteMapUrl && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#5C6870" }}>
                <MapPin size={28} />
                <span style={{ fontSize: 13 }}>No site map uploaded yet — add one from Settings</span>
              </div>
            )}
          </div>

          {points.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontSize: 11, color: "#8A9198" }}>Fewer</span>
              <div style={{ flex: 1, height: 7, borderRadius: 3.5, background: "linear-gradient(90deg, #188CC6, #18C9C6, #E0A80F, #DC2626)" }} />
              <span style={{ fontSize: 11, color: "#8A9198" }}>More</span>
            </div>
          )}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 10 }}>
          Pinned reports {pinned.length > 0 && `(${pinned.length})`}
        </div>

        {pinned.length === 0 ? (
          <div style={{ background: "#0d1b26", border: "1px solid rgba(160,190,204,0.14)", borderRadius: 14, padding: "26px 18px", textAlign: "center", color: "#8A9198", fontSize: 13 }}>
            Nothing pinned yet. Reports get a pin when they're filed with a location tapped on the site map.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pinned.map((r) => {
              const badge = TYPE_BADGE[r.report_type] || TYPE_BADGE.OFI;
              return (
                <button
                  key={r.id}
                  onClick={() => openReport(r)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    background: "#0d1b26", border: "1px solid rgba(160,190,204,0.14)", borderRadius: 12,
                    padding: "11px 14px", textAlign: "left", cursor: "pointer", font: "inherit",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ background: badge.bg, color: badge.color, fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, flex: "none" }}>
                      {r.report_type || "Unspecified"}
                    </span>
                    <span style={{ color: "#D5D8DC", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.location || "Unlocated"}
                    </span>
                  </div>
                  <span style={{ color: "#5C6870", fontSize: 11.5, flex: "none" }}>
                    {r.report_date || (r.created_at || "").slice(0, 10)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
