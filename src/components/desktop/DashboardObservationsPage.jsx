import React, { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import { Search } from "lucide-react";

const TYPE_BADGE = {
  "Good Spot": { bg: "#178F8C", color: "#D8FFFF" },
  "Hazard": { bg: "#246DAE", color: "#DCEFFF" },
  "Closecall": { bg: "#C98718", color: "#FFF2D4" },
  "OFI": { bg: "#66737C", color: "#F0F3F4" },
};

/* Desktop Observations list — the real report log, reusing the same
   `reports` data as the mobile app and the dashboard's Recent
   Observations widget. Filterable by type and searchable by
   location/description. Clicking a row opens the existing DetailView
   (via onOpenReport), so photo/export/email logic isn't duplicated. */
export default function DashboardObservationsPage({ profile, reports, setView, showToast, setActiveReport }) {
  const [filterType, setFilterType] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = reports
    .filter((r) => filterType === "all" || r.report_type === filterType)
    .filter((r) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (r.location || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  function handleSidebarNav(key) {
    if (key === "observations") return;
    if (key === "dashboard") setView("home");
    else if (key === "actions") setView("actions-desktop");
    else if (key === "inspections") setView("inspections-desktop");
    else if (key === "reports") setView("stats");
    else if (key === "settings") setView("settings");
    else showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} isn't built yet — coming soon`);
  }

  function openReport(r) {
    setActiveReport(r);
    setView("detail");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08131D", display: "flex", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <DashboardSidebar active="observations" onNavigate={handleSidebarNav} profile={profile} />

      <div style={{ flex: 1, padding: "22px 28px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 650, color: "#F0F4F6" }}>Observations</div>
          <div style={{ fontSize: 12.5, color: "#8997A1", marginTop: 4 }}>{reports.length} total across the site</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#0D1B25", border: "1px solid rgba(121,159,176,0.16)", borderRadius: 10, padding: "0 14px", height: 40 }}>
            <Search size={15} color="#8F9CA4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by location or description…"
              style={{ background: "none", border: "none", outline: "none", color: "#F1F4F5", fontSize: 13, width: "100%" }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ background: "#0D1B25", border: "1px solid rgba(121,159,176,0.16)", borderRadius: 10, padding: "0 14px", height: 40, color: "#D7DFE3", fontSize: 13 }}
          >
            <option value="all">All types</option>
            <option value="Good Spot">Good Spot</option>
            <option value="Hazard">Hazard</option>
            <option value="Closecall">Close Call</option>
            <option value="OFI">OFI</option>
          </select>
        </div>

        <div style={{ background: "#0C1A24", border: "1px solid rgba(126,164,181,0.16)", borderRadius: 14, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#70808B", fontSize: 13 }}>No observations match your filters.</div>
          ) : (
            filtered.map((r, i) => {
              const badge = TYPE_BADGE[r.report_type] || TYPE_BADGE["OFI"];
              return (
                <button
                  key={r.id}
                  onClick={() => openReport(r)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "70px 42px 1fr 140px 90px",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    background: "none",
                    border: "none",
                    borderBottom: i === filtered.length - 1 ? "none" : "1px solid rgba(121,157,173,0.12)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ background: badge.bg, color: badge.color, fontSize: 9, fontWeight: 700, padding: "0 8px", height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, whiteSpace: "nowrap" }}>
                    {r.report_type?.toUpperCase()}
                  </span>
                  {r.photo_data_url ? (
                    <img src={r.photo_data_url} alt="" style={{ width: 42, height: 42, borderRadius: 7, objectFit: "cover", border: "1px solid rgba(170,190,198,0.18)" }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: 7, background: "#1c2b38" }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#E0E6E9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.description ? r.description.slice(0, 70) : "No description"}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#8997A0", marginTop: 3 }}>{r.location}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#8997A0" }}>{r.respondent || "—"}</div>
                  <div style={{ fontSize: 11.5, color: "#70808B", textAlign: "right" }}>{r.report_date}</div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
