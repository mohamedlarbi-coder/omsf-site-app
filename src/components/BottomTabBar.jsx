import React from "react";
import { Home, ClipboardList, Plus, CheckSquare, Menu } from "lucide-react";

/* Fixed bottom tab bar — frosted glass style: translucent background,
   backdrop blur, subtle top border with cyan tint, active tab gets a
   small glowing underline. Matches MINERVIUM's premium/enterprise
   direction rather than a flat opaque bar. */
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
        aria-label={tab.label}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          flex: 1, minHeight: 48, paddingTop: 6, background: "none", border: "none",
          color: isActive ? "#23E0DC" : "#7C8891",
        }}
      >
        <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
        <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
        <span
          style={{
            width: isActive ? 36 : 0, height: 3, borderRadius: 2, marginTop: 2,
            background: "#23E0DC", boxShadow: isActive ? "0 0 8px rgba(35,224,220,0.7)" : "none",
            transition: "width 0.2s ease",
          }}
        />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20"
      style={{
        background: "rgba(9,20,28,0.66)",
        borderTop: "1px solid rgba(58,211,218,0.26)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        boxShadow: "0 -12px 30px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="max-w-md mx-auto flex items-center px-2 pt-2 relative" style={{ minHeight: 88 }}>
        {tabs.map((t) => <TabButton key={t.key} tab={t} />)}

        {/* Raised central "+" button — overlaps the nav bar slightly */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onNewObservation}
            aria-label="New Observation"
            className="active:scale-[0.94] transition-transform duration-150"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1BD5D3, #07949B)",
              border: "3px solid rgba(9,20,28,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#031014",
              boxShadow: "0 0 0 6px rgba(0,219,224,0.06), 0 10px 30px rgba(0,219,224,0.25)",
              transform: "translateY(-18px)",
            }}
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        {tabsRight.map((t) => <TabButton key={t.key} tab={t} />)}
      </div>
    </div>
  );
}
