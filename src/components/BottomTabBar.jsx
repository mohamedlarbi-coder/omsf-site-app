import React from "react";
import { Home, ClipboardList, Plus, CheckSquare, Menu } from "lucide-react";

/* Fixed bottom tab bar matching the MINERVIUM reference: Home,
   Observations, a raised teal "+" action button (New Observation),
   Actions, and More. The "+" always starts a new observation
   regardless of which tab you're on, same as most mobile apps. */
export default function BottomTabBar({ active, onNavigate, onNewObservation }) {
  const tabs = [
    { key: "home", label: "Home", icon: Home },
    { key: "observations", label: "Observations", icon: ClipboardList },
  ];
  const tabsRight = [
    { key: "actions", label: "Actions", icon: CheckSquare },
    { key: "more", label: "More", icon: Menu },
  ];

  function TabButton({ tab }) {
    const Icon = tab.icon;
    const isActive = active === tab.key;
    return (
      <button
        onClick={() => onNavigate(tab.key)}
        className="flex flex-col items-center gap-1 flex-1 py-1.5"
        style={{ color: isActive ? "#18C9CB" : "#5C6870" }}
      >
        <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
        <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500 }}>{tab.label}</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20"
      style={{
        background: "#0B1620",
        borderTop: "1px solid rgba(160, 190, 204, 0.14)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="max-w-md mx-auto flex items-center px-2 pt-2 relative">
        {tabs.map((t) => <TabButton key={t.key} tab={t} />)}

        {/* Raised central "+" button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onNewObservation}
            aria-label="New Observation"
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1BD5D3, #07949B)",
              border: "3px solid #0B1620",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#031014",
              boxShadow: "0 6px 18px rgba(0, 181, 185, 0.35)",
              transform: "translateY(-14px)",
            }}
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {tabsRight.map((t) => <TabButton key={t.key} tab={t} />)}
      </div>
    </div>
  );
}
