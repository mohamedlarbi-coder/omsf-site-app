import React, { useEffect, useState } from "react";
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

const STORAGE_KEY = "minervium.sidebar.collapsed";

/* Left sidebar navigation for the desktop Dashboard. Only "Dashboard",
   "Observations", "Inspections", "Actions", "Analytics", "Reports" and
   "Settings" route anywhere yet (Incidents and Users aren't built —
   clicking them shows a "coming soon" toast).

   Clicking the logo collapses the bar to an icon rail. The state is kept in
   localStorage rather than component state because each desktop page mounts
   its own sidebar: without persistence the bar would spring back open every
   time you navigated, which is worse than not having the toggle at all. */
export default function DashboardSidebar({ active, onNavigate, profile }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false; // private mode, storage disabled — just default to open
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* not worth surfacing — the toggle still works for this session */
    }
  }, [collapsed]);

  const width = collapsed ? 68 : 220;

  return (
    <div
      style={{
        width,
        flex: "none",
        minHeight: "100vh",
        background: "#0A141C",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? "20px 10px" : "20px 14px",
        transition: "width 180ms cubic-bezier(0.22,1,0.36,1), padding 180ms ease",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: collapsed ? 0 : "0 6px",
          marginBottom: 28,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          justifyContent: collapsed ? "center" : "flex-start",
          width: "100%",
        }}
      >
        <MinerviumLogo size={collapsed ? 40 : 48} showWordmark={false} showTagline={false} />
        {!collapsed && (
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}
          >
            MINERVIUM
          </span>
        )}
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
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
              <Icon size={16} style={{ flex: "none" }} />
              {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              {isActive && !collapsed && (
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

      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          title={collapsed ? profile?.my_name || "Unnamed" : undefined}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #1BD5D3, #07949B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#031014", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}
        >
          {(profile?.my_name || "?").trim().charAt(0).toUpperCase()}
        </div>

        {!collapsed && (
          <>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: "#FFFFFF", fontSize: 12.5, fontWeight: 600,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {profile?.my_name || "Unnamed"}
              </div>
              <div style={{ color: "#5C6870", fontSize: 11 }}>
                {profile?.my_position || "Team Member"}
              </div>
            </div>
            <ChevronDown size={14} color="#5C6870" style={{ marginLeft: "auto", flex: "none" }} />
          </>
        )}
      </div>
    </div>
  );
}
