import React from "react";
import { Bell } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardKPICards from "./DashboardKPICards";
import DashboardDonutChart from "./DashboardDonutChart";
import DashboardRecentObservations from "./DashboardRecentObservations";
import DashboardProjectMap from "./DashboardProjectMap";

/* MINERVIUM — Desktop Dashboard, the landing screen when the app is
   opened from a computer (wide screen). Mirrors the mobile Home
   screen's role but with the full sidebar + widgets layout used by
   desktop/admin users. Real data (reports) is used wherever it
   exists; a few KPIs (Closed Actions, Participants, Safety
   Improvement) are placeholders since those features aren't built
   yet — see DashboardKPICards for the exact breakdown. */
export default function DesktopDashboardPage({ profile, reports, setView, showToast }) {
  function comingSoon(feature) {
    showToast(`${feature} isn't built yet — coming soon`);
  }

  function handleSidebarNav(key) {
    if (key === "dashboard") return;
    if (key === "observations") setView("observations-desktop");
    else if (key === "actions") setView("actions-desktop");
    else if (key === "inspections") setView("inspections-desktop");
    else if (key === "reports") setView("stats");
    else if (key === "settings") setView("settings");
    else comingSoon(key.charAt(0).toUpperCase() + key.slice(1));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08131D", display: "flex", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <DashboardSidebar active="dashboard" onNavigate={handleSidebarNav} profile={profile} />

      <div style={{ flex: 1, padding: "22px 28px", overflowX: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>Dashboard</div>
            <div style={{ fontSize: 12.5, color: "#8A9198", marginTop: 2 }}>Overview of your projects and activity</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#0d1b26", border: "1px solid rgba(160,190,204,0.14)", borderRadius: 10, padding: "7px 14px", color: "#D5D8DC", fontSize: 12.5 }}>
              Ontario Line — OMSF ▾
            </div>
            <button
              style={{ position: "relative", width: 34, height: 34, borderRadius: 10, background: "#0d1b26", border: "1px solid rgba(160,190,204,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onClick={() => comingSoon("Notifications")}
            >
              <Bell size={16} color="#D5D8DC" />
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#18C9CB",
                  color: "#031014",
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #08131D",
                }}
              >
                3
              </span>
            </button>
          </div>
        </div>

        <DashboardKPICards totalObservations={reports.length} />

        <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          <DashboardDonutChart reports={reports} />
          <DashboardRecentObservations reports={reports} onViewAll={() => setView("log")} />
        </div>

        <DashboardProjectMap onViewFullMap={() => comingSoon("Full project map")} />
      </div>
    </div>
  );
}
