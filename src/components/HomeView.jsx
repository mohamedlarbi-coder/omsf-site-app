import React from "react";
import { FileText, ShieldCheck, ClipboardCheck, FileBarChart, ChevronRight } from "lucide-react";
import BottomTabBar from "./BottomTabBar";

/* MINERVIUM mobile Home screen — logo, tagline, "New Observation" CTA,
   and a card menu into the app's main areas. Observations shows the
   real report count; Inspections is now real too (its own table).
   Actions still shows a placeholder count (0) — it's derived from
   report data on desktop but doesn't have a mobile view yet. */
export default function HomeView({ reports, setView }) {
  const menuItems = [
    {
      key: "observations",
      icon: FileText,
      title: "Observations",
      subtitle: "View and manage",
      count: reports.length,
      onClick: () => setView("log"),
    },
    {
      key: "actions",
      icon: ShieldCheck,
      title: "Actions",
      subtitle: "Open actions",
      count: 0,
      comingSoon: true,
    },
    {
      key: "inspections",
      icon: ClipboardCheck,
      title: "Inspections",
      subtitle: "Planned & completed",
      onClick: () => setView("inspections"),
    },
    {
      key: "reports",
      icon: FileBarChart,
      title: "Reports",
      subtitle: "Generate reports",
      onClick: () => setView("stats"),
    },
  ];

  return (
    <div className="min-h-screen bg-black font-sans relative overflow-x-hidden">
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/branding/logo-black-bg-full.png')",
          backgroundSize: "contain",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#000000",
          pointerEvents: "none",
        }}
      />
      <div className="max-w-md mx-auto pb-32 relative z-10 px-5 pt-[max(2rem,env(safe-area-inset-top))]">
        {/* Logo/wordmark/tagline now live inside the fixed background
            image itself — no need to render them again here. */}
        <div className="mb-9" style={{ height: 260 }} />

        <button
          onClick={() => setView("form")}
          className="
            w-full min-h-[60px]
            bg-gradient-to-r from-[#18BFB8] to-[#109AB5]
            hover:from-[#20CFC7] hover:to-[#16A9C2]
            active:scale-[0.985]
            text-white text-[17px] font-bold tracking-wide
            rounded-2xl
            flex items-center justify-center gap-3
            border border-cyan-300/15
            shadow-[0_14px_34px_rgba(8,159,174,0.24)]
            transition-all duration-200
            mb-7
          "
        >
          <span className="text-[26px] leading-none font-light">+</span>
          <span>New Observation</span>
        </button>

        <div
          className="
            bg-[#0B1C27]/95
            border border-slate-700/45
            rounded-2xl overflow-hidden
            shadow-[0_18px_44px_rgba(0,0,0,0.28)]
            backdrop-blur-md
          "
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isLast = i === menuItems.length - 1;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                disabled={!item.onClick}
                className={`
                  w-full min-h-[104px]
                  flex items-center justify-between
                  px-5 py-5 text-left
                  transition-colors duration-150
                  ${!isLast ? "border-b border-slate-700/40" : ""}
                  ${
                    item.onClick
                      ? "hover:bg-white/[0.025] active:bg-teal-400/[0.045]"
                      : "opacity-60 cursor-default"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={27}
                    className="text-slate-300 shrink-0"
                    strokeWidth={1.75}
                  />
                  <div>
                    <div className="text-white text-[17px] leading-tight font-semibold">
                      {item.title}
                    </div>
                    <div className="text-slate-500 text-[13px] mt-1 leading-snug">
                      {item.subtitle}
                      {item.comingSoon && " · Coming soon"}
                    </div>
                  </div>
                </div>
                {typeof item.count === "number" ? (
                  <span
                    className="
                      min-w-[44px] h-10 px-3
                      inline-flex items-center justify-center
                      text-teal-300 text-[16px] font-bold
                      bg-teal-500/10 border border-teal-400/5
                      rounded-xl
                    "
                  >
                    {item.count}
                  </span>
                ) : (
                  <ChevronRight size={18} className="text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <BottomTabBar
        active="home"
        onNavigate={(key) => {
          if (key === "home") return;
          if (key === "observations") setView("log");
          else if (key === "more") setView("settings");
          // "actions" has no mobile destination yet — feature not built there.
        }}
        onNewObservation={() => setView("form")}
      />
    </div>
  );
}
