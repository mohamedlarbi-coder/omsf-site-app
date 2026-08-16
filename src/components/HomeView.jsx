import React from "react";
import { FileText, ShieldCheck, ClipboardCheck, FileBarChart, ChevronRight, Bell, Plus, Calendar } from "lucide-react";
import BottomTabBar from "./BottomTabBar";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/* Honeycomb background — SVG pattern over a layered radial/linear gradient.
   Masked so the hexagons read strongest upper-right / mid-right and fade
   into black elsewhere, which keeps the tiling from looking repetitive.
   Fixed (not absolute) so it stays put while the dashboard scrolls. */
function HexBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 85% 30%, rgba(0,220,230,0.12), transparent 30%), radial-gradient(circle at 20% 65%, rgba(0,150,170,0.06), transparent 35%), linear-gradient(180deg, #020B0F 0%, #031116 45%, #02090D 100%)",
      }}
    >
      {/* Base honeycomb — wide, faint, unevenly revealed */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 45% at 88% 20%, #000 0%, rgba(0,0,0,0.55) 45%, transparent 78%), radial-gradient(ellipse 60% 40% at 80% 58%, rgba(0,0,0,0.75) 0%, transparent 72%), radial-gradient(ellipse 55% 35% at 15% 74%, rgba(0,0,0,0.32) 0%, transparent 70%)",
          maskImage:
            "radial-gradient(ellipse 70% 45% at 88% 20%, #000 0%, rgba(0,0,0,0.55) 45%, transparent 78%), radial-gradient(ellipse 60% 40% at 80% 58%, rgba(0,0,0,0.75) 0%, transparent 72%), radial-gradient(ellipse 55% 35% at 15% 74%, rgba(0,0,0,0.32) 0%, transparent 70%)",
        }}
      >
        <defs>
          <pattern id="hexBase" width="80" height="69" patternUnits="userSpaceOnUse">
            <path
              d="M20 0 L60 0 L80 34.5 L60 69 L20 69 L0 34.5 Z"
              fill="none"
              stroke="rgba(15,210,220,0.15)"
              strokeWidth="1"
            />
          </pattern>
          <pattern id="hexOffset" width="80" height="69" patternUnits="userSpaceOnUse" patternTransform="translate(40, 34.5)">
            <path
              d="M20 0 L60 0 L80 34.5 L60 69 L20 69 L0 34.5 Z"
              fill="none"
              stroke="rgba(15,210,220,0.09)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexBase)" />
        <rect width="100%" height="100%" fill="url(#hexOffset)" />
      </svg>

      {/* A handful of brighter cells, right side only — breaks the grid rhythm */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: "radial-gradient(ellipse 42% 28% at 92% 24%, #000 0%, transparent 70%)",
          maskImage: "radial-gradient(ellipse 42% 28% at 92% 24%, #000 0%, transparent 70%)",
        }}
      >
        <defs>
          <pattern id="hexGlow" width="160" height="138" patternUnits="userSpaceOnUse">
            <path
              d="M20 0 L60 0 L80 34.5 L60 69 L20 69 L0 34.5 Z"
              fill="rgba(19,220,229,0.035)"
              stroke="rgba(32,241,239,0.42)"
              strokeWidth="1.1"
            />
            <path
              d="M100 69 L140 69 L160 103.5 L140 138 L100 138 L80 103.5 Z"
              fill="none"
              stroke="rgba(32,241,239,0.22)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGlow)" />
      </svg>

      {/* Bottom fade so the pattern never competes with the card stack */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "42%",
          background: "linear-gradient(0deg, #02090D 0%, rgba(2,9,13,0.85) 38%, rgba(2,9,13,0) 100%)",
        }}
      />
    </div>
  );
}

/* MINERVIUM mobile Home Dashboard — dynamic greeting + real user name,
   project meta, honeycomb technology background, primary "New Observation"
   CTA, glass dashboard tiles, and the fixed bottom nav.
   Observations/Inspections/Reports use real data/routes; Actions is still a
   placeholder (0, disabled) since that feature doesn't have real data behind
   it yet — see DashboardActionsPage.jsx comments for why it's derived-only on
   desktop and not built here. */
export default function HomeView({ reports, setView, profile }) {
  const userName = (profile?.my_name || "").split(" ")[0] || "there";
  const initial = (profile?.my_name || "?").trim().charAt(0).toUpperCase();

  const tiles = [
    {
      id: "observations",
      icon: FileText,
      title: "Observations",
      description: "View and manage all observations",
      count: reports.length,
      onClick: () => setView("log"),
    },
    {
      id: "actions",
      icon: ShieldCheck,
      title: "Actions",
      description: "Open actions · Coming soon",
      count: 0,
      disabled: true,
    },
    {
      id: "inspections",
      icon: ClipboardCheck,
      title: "Inspections",
      description: "Planned & completed inspections",
      onClick: () => setView("inspections"),
    },
    {
      id: "reports",
      icon: FileBarChart,
      title: "Reports",
      description: "Generate and export reports",
      onClick: () => setView("stats"),
    },
  ];

  return (
    <div
      className="relative w-full overflow-x-hidden"
      style={{ minHeight: "100dvh", background: "#020B0F", color: "#F5F7F7" }}
    >
      <HexBackground />

      <div
        className="relative mx-auto"
        style={{
          zIndex: 1,
          maxWidth: 520,
          paddingInline: 16,
          paddingTop: "calc(20px + env(safe-area-inset-top))",
          paddingBottom: "calc(150px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Header — logo, greeting, bell, avatar. No card, no banner. */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14 }}>
          <img
            src="/branding/logo-icon.png"
            alt="MINERVIUM construction safety platform"
            style={{ width: 54, height: 54, objectFit: "contain" }}
          />
          <div style={{ lineHeight: 1.15, minWidth: 0 }}>
            <div style={{ color: "#F5F7F7", fontWeight: 800, fontSize: "clamp(16px, 4.2vw, 19px)" }}>{greeting()}</div>
            <div style={{ color: "#20F1EF", fontWeight: 800, fontSize: "clamp(18px, 4.8vw, 22px)" }}>{userName}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              aria-label="Notifications"
              style={{
                position: "relative",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(4,23,28,0.72)",
                border: "1px solid rgba(20,220,229,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Bell size={19} color="#F5F7F7" strokeWidth={1.9} />
              <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: "#20F1EF", boxShadow: "0 0 6px rgba(32,241,239,0.85)" }} />
            </button>
            <div
              aria-hidden="true"
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(3,17,22,0.85)",
                border: "1.5px solid rgba(20,220,229,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#13DCE5", fontWeight: 700, fontSize: 17,
                boxShadow: "0 0 14px rgba(19,220,229,0.14)",
              }}
            >
              {initial}
            </div>
          </div>
        </div>

        {/* Project + date meta */}
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <div style={{ fontSize: "clamp(13px, 3.4vw, 15px)" }}>
            <span style={{ color: "#13DCE5", fontWeight: 700 }}>OMSF Project</span>
            <span style={{ color: "#9AA5AA" }}> · Toronto, ON</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6, marginTop: 8, color: "#9AA5AA", fontSize: "clamp(12px, 3vw, 13.5px)" }}>
            <Calendar size={13} />
            <span>{todayLabel()}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <ShieldCheck size={13} />
            <span>Site Safety Dashboard</span>
          </div>
        </div>

        {/* Breathing room so the honeycomb reads before the CTA.
            Total header block lands around 240-280px. */}
        <div style={{ height: "clamp(56px, 12vh, 104px)" }} />

        {/* New Observation CTA */}
        <button
          onClick={() => setView("form")}
          className="active:scale-[0.985] transition-transform duration-200"
          style={{
            width: "100%",
            minHeight: 76,
            borderRadius: 24,
            display: "flex", alignItems: "center", gap: 14,
            padding: "0 20px",
            background: "linear-gradient(100deg, #20E5E5 0%, #16CBD3 45%, #08798D 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 30px rgba(0,220,230,0.18)",
            marginBottom: 26,
          }}
        >
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#04171C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Plus size={21} color="#20F1EF" strokeWidth={2.6} />
          </div>
          <span style={{ flex: 1, textAlign: "left", color: "#02090D", fontWeight: 800, fontSize: "clamp(17px, 4.4vw, 20px)" }}>New Observation</span>
          <ChevronRight size={22} color="#04171C" strokeWidth={2.5} />
        </button>

        {/* Dashboard tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={tile.onClick}
                disabled={!tile.onClick}
                aria-label={tile.title}
                style={{
                  width: "100%",
                  minHeight: 105,
                  borderRadius: 22,
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px",
                  background: "rgba(2,18,23,0.88)",
                  border: "1px solid rgba(20,220,229,0.22)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  opacity: tile.disabled ? 0.55 : 1,
                  cursor: tile.onClick ? "pointer" : "default",
                  textAlign: "left",
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(7,51,58,0.55)", border: "1px solid rgba(20,220,229,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={23} color="#13DCE5" strokeWidth={1.7} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#F5F7F7", fontWeight: 700, fontSize: "clamp(16px, 4vw, 18px)" }}>{tile.title}</div>
                  <div style={{ color: "#9AA5AA", fontSize: "clamp(13px, 3.3vw, 15px)", marginTop: 3 }}>{tile.description}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {typeof tile.count === "number" && (
                    <span
                      style={{
                        minWidth: 40, height: 36, padding: "0 10px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#13DCE5", fontWeight: 800, fontSize: 16,
                        background: "rgba(7,51,58,0.72)", borderRadius: 12,
                      }}
                    >
                      {tile.count}
                    </span>
                  )}
                  <ChevronRight size={18} color="#9AA5AA" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 34, color: "#9AA5AA", fontSize: "clamp(10px, 2.7vw, 12.5px)", opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          🔒 Protecting people. Empowering construction.
        </div>
      </div>

      <BottomTabBar
        active="home"
        onNavigate={(key) => {
          if (key === "home") return;
          if (key === "observations") setView("log");
          else if (key === "more") setView("settings");
        }}
        onNewObservation={() => setView("form")}
      />
    </div>
  );
}
