import React from "react";
import { FileText, ShieldCheck, ClipboardCheck, FileBarChart, ChevronRight } from "lucide-react";
import MinerviumLogo from "./MinerviumLogo";
import BackgroundWatermark from "./BackgroundWatermark";
import BottomTabBar from "./BottomTabBar";

/* MINERVIUM mobile Home screen — logo, tagline, "New Observation" CTA,
   and a card menu into the app's main areas. Observations shows the
   real report count; Actions and Inspections are placeholder counts
   (0) since those features don't exist as real data yet — only
   Observations (hazard/good spot reports) is a built feature so far. */
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
      count: 0,
      comingSoon: true,
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
    <div className="min-h-screen bg-[#08131D] font-sans relative">
      <BackgroundWatermark />
      <div className="max-w-md mx-auto pb-28 relative z-10 px-6 pt-10">
        <div className="flex flex-col items-center text-center mb-8">
          <MinerviumLogo size={180} full />
        </div>

        <button
          onClick={() => setView("form")}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold tracking-wide py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all mb-6"
        >
          <span className="text-lg leading-none">+</span> New Observation
        </button>

        <div className="bg-[#0d1b26] border border-slate-800 rounded-2xl overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isLast = i === menuItems.length - 1;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                disabled={!item.onClick}
                className={`w-full flex items-center justify-between px-5 py-4 text-left ${!isLast ? "border-b border-slate-800" : ""} ${item.onClick ? "hover:bg-white/[0.02]" : "opacity-60 cursor-default"}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-slate-300" strokeWidth={1.75} />
                  <div>
                    <div className="text-white text-[15px] font-semibold">{item.title}</div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {item.subtitle}{item.comingSoon && " · Coming soon"}
                    </div>
                  </div>
                </div>
                {typeof item.count === "number" ? (
                  <span className="text-teal-400 text-sm font-bold bg-teal-500/10 px-2.5 py-1 rounded-lg">{item.count}</span>
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
          // "actions" has no destination yet — feature not built.
        }}
        onNewObservation={() => setView("form")}
      />
    </div>
  );
}
