import React from "react";
import {
  LayoutDashboard, FileText, ClipboardCheck, AlertTriangle, CheckSquare,
  BarChart2, Users, FileBarChart, Settings, ChevronDown,
} from "lucide-react";
import MinerviumLogo from "../MinerviumLogo";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "observations", label: "Observations", icon: FileText },
  { key: "inspections", label: "Inspections", icon: ClipboardCheck },
  { key: "incidents", label: "Incidents", icon: AlertTriangle },
  { key: "actions", label: "Actions", icon: CheckSquare },
  { key: "analytics", label: "Analytics", icon: BarChart2 },
  { key: "users", label: "Users", icon: Users },
  { key: "reports", label: "Reports", icon: FileBarChart },
  { key: "settings", label: "Settings", icon: Settings },
];

/* Left sidebar navigation for the desktop Dashboard. Only "Dashboard"
   and "Observations"/"Reports"/"Settings" actually route anywhere yet
   (Inspections, Incidents, Actions, Analytics, Users aren't built
   features — clicking them shows a "coming soon" toast). */
export default function DashboardSidebar({ active, onNavigate, profile }) {
  return (
    <div
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#0A141C",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px", marginBottom: 28 }}>
        <MinerviumLogo size={26} />
        <span style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, letterSpacing: "0.03em" }}>MINERVIUM</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                background: isActive
                  ? "linear-gradient(90deg, rgba(8,147,152,0.88), rgba(8,111,119,0.78))"
                  : "transparent",
                color: isActive ? "#25E0DE" : "#8A9198",
                border: "none",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} />
              {item.label}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    right: -14,
                    top: 0,
                    width: 4,
                    height: "100%",
                    background: "#20E0DD",
                    borderRadius: "3px 0 0 3px",
                    boxShadow: "0 0 12px rgba(32, 224, 221, 0.65)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #1BD5D3, #07949B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#031014", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}
        >
          {(profile?.my_name || "?").trim().charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {profile?.my_name || "Unnamed"}
          </div>
          <div style={{ color: "#5C6870", fontSize: 11 }}>{profile?.my_position || "Team Member"}</div>
        </div>
        <ChevronDown size={14} color="#5C6870" style={{ marginLeft: "auto" }} />
      </div>
    </div>
  );
}
