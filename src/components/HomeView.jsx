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

/* MINERVIUM mobile Home Dashboard — header with dynamic greeting and
   real user name, project meta, subtle background artwork, primary
   "New Observation" CTA, four translucent glass tiles, and the glass
   bottom nav. Observations/Inspections/Reports use real data/routes;
   Actions is still a placeholder (0, disabled) since that feature
   doesn't have real data behind it yet — see DashboardActionsPage.jsx
   comments for why it's derived-only on desktop and not built here. */
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
      className="relative w-full overflow-x-hidden text-white"
      style={{ minHeight: "100dvh", background: "#000000" }}
    >
      {/* Background artwork — fixed behind all content. The wrapper carries a
          solid black fill so nothing shows through below the artwork; the
          image itself is contained (never cropped) and confined to the top
          of the screen, then faded into black. */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          background: "#000000",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            /* svh = smallest viewport height: stays put when the Safari
               address bar collapses. Lower this number to shrink the art. */
            height: "60svh",
            backgroundImage: "url('/branding/hero-background.jpg')",
            backgroundSize: "contain",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 26%, rgba(0,0,0,0.72) 54%, #000000 74%, #000000 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 26%, rgba(0,216,220,0.07), rgba(0,0,0,0) 42%)",
          }}
        />
      </div>

      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 900,
          paddingInline: "clamp(18px, 4vw, 40px)",
          paddingTop: "calc(18px + env(safe-area-inset-top))",
          paddingBottom: "calc(150px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14 }}>
          <img
            src="/branding/logo-icon.png"
            alt="MINERVIUM construction safety platform"
            style={{ width: 56, height: 56, objectFit: "contain" }}
          />
          <div style={{ lineHeight: 1.1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(16px, 4.2vw, 19px)" }}>{greeting()}</div>
            <div style={{ color: "#23E0DC", fontWeight: 800, fontSize: "clamp(18px, 4.8vw, 22px)" }}>{userName}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              aria-label="Notifications"
              style={{
                position: "relative",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Bell size={19} color="#D5D8DC" />
              <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: "#23E0DC", boxShadow: "0 0 6px rgba(35,224,220,0.8)" }} />
            </button>
            <div
              aria-hidden="true"
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(11,28,39,0.7)", border: "1.5px solid rgba(35,224,220,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#23E0DC", fontWeight: 700, fontSize: 17,
                boxShadow: "0 0 14px rgba(35,224,220,0.12)",
              }}
            >
              {initial}
            </div>
          </div>
        </div>

        {/* Project + date meta */}
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <div style={{ fontSize: "clamp(13px, 3.4vw, 15px)" }}>
            <span style={{ color: "#23E0DC", fontWeight: 700 }}>OMSF Project</span>
            <span style={{ color: "#8A9198" }}> · Toronto, ON</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6, color: "#8A9198", fontSize: "clamp(12px, 3vw, 13.5px)" }}>
            <Calendar size={13} />
            <span>{todayLabel()}</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <ShieldCheck size={13} />
            <span>Site Safety Dashboard</span>
          </div>
        </div>

        {/* Spacer so the background artwork breathes before the CTA.
            Scales with the screen instead of a fixed 140px — raise the
            middle value if you want the CTA pushed further down. */}
        <div style={{ height: "clamp(80px, 22vh, 180px)" }} />

        {/* New Observation CTA */}
        <button
          onClick={() => setView("form")}
          className="active:scale-[0.985] transition-transform duration-200"
          style={{
            width: "100%",
            minHeight: 78,
            borderRadius: 26,
            display: "flex", alignItems: "center", gap: 14,
            padding: "0 20px",
            background: "linear-gradient(110deg, rgba(23,216,218,0.92) 0%, rgba(34,209,214,0.82) 52%, rgba(14,91,116,0.68) 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 14px 34px rgba(8,159,174,0.24)",
            backdropFilter: "blur(18px) saturate(125%)",
            WebkitBackdropFilter: "blur(18px) saturate(125%)",
            marginBottom: 28,
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(3,10,13,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Plus size={20} color="#23E0DC" strokeWidth={2.6} />
          </div>
          <span style={{ flex: 1, textAlign: "left", color: "#031014", fontWeight: 800, fontSize: "clamp(16px, 4.2vw, 18px)" }}>New Observation</span>
          <ChevronRight size={22} color="#031014" strokeWidth={2.5} />
        </button>

        {/* Dashboard tiles — translucent glass cards */}
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
                  minHeight: 84,
                  borderRadius: 22,
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px",
                  background: "rgba(11,28,39,0.42)",
                  border: "1px solid rgba(58,211,218,0.18)",
                  backdropFilter: "blur(20px) saturate(130%)",
                  WebkitBackdropFilter: "blur(20px) saturate(130%)",
                  opacity: tile.disabled ? 0.55 : 1,
                  cursor: tile.onClick ? "pointer" : "default",
                  textAlign: "left",
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(35,224,220,0.08)", border: "1px solid rgba(35,224,220,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={21} color="#23E0DC" strokeWidth={1.75} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: "clamp(15px, 3.8vw, 17px)" }}>{tile.title}</div>
                  <div style={{ color: "#9AA5AC", fontSize: "clamp(11.5px, 3vw, 13px)", marginTop: 2 }}>{tile.description}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {typeof tile.count === "number" && (
                    <span
                      style={{
                        minWidth: 38, height: 34, padding: "0 10px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#23E0DC", fontWeight: 800, fontSize: 15,
                        background: "rgba(35,224,220,0.1)", borderRadius: 12,
                      }}
                    >
                      {tile.count}
                    </span>
                  )}
                  <ChevronRight size={18} color="#5C6870" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, color: "#8A9198", fontSize: "clamp(10px, 2.7vw, 13px)", opacity: 0.65, letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
