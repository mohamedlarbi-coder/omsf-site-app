import React, { forwardRef, useState } from "react";
import { Check, Info } from "lucide-react";

/* A single column within the unified 4-section observation type panel.
   Unlike separate floating cards, these sit inside one shared bordered
   container (see ObservationTypeGrid), divided by thin vertical lines —
   matching the approved reference exactly. */
const ObservationTypeCard = forwardRef(function ObservationTypeCard(
  { icon: Icon, iconColor, iconFill, glow, title, description, tooltip, selected, onSelect, onKeyDown, isLast },
  ref
) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  let background = "transparent";
  if (selected) background = "linear-gradient(150deg, rgba(15, 57, 65, 0.9), rgba(8, 33, 41, 0.9))";
  else if (hovered) background = "rgba(255, 255, 255, 0.02)";

  const focusRing = focused ? "0 0 0 3px rgba(20, 201, 203, 0.24)" : "none";

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: "relative",
        flex: "1 1 0",
        minHeight: 48,
        height: 360,
        padding: "26px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
        outline: "none",
        background,
        border: "none",
        borderRight: isLast ? "none" : "1px solid rgba(160, 190, 204, 0.14)",
        boxShadow: focusRing,
        transition: "background 180ms ease, box-shadow 180ms ease",
      }}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#18C9CB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "minervium-check-pop 180ms ease",
          }}
        >
          <Check size={13} strokeWidth={3} color="#031014" />
        </div>
      )}

      <div style={{ height: 64, marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={44} color={iconColor} fill={iconFill} strokeWidth={1.6} style={{ filter: glow }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#F1F5F6" }}>{title}</span>
        {tooltip && (
          <span
            role="tooltip"
            tabIndex={-1}
            onMouseEnter={(e) => { e.stopPropagation(); setTooltipOpen(true); }}
            onMouseLeave={(e) => { e.stopPropagation(); setTooltipOpen(false); }}
            onClick={(e) => { e.stopPropagation(); setTooltipOpen((v) => !v); }}
            style={{ position: "relative", display: "inline-flex", color: "#73828B", cursor: "help" }}
          >
            <Info size={13} strokeWidth={1.75} />
            {tooltipOpen && (
              <span
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 190,
                  background: "#0C1B24",
                  border: "1px solid rgba(160, 190, 204, 0.22)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11.5,
                  lineHeight: 1.5,
                  color: "#A9B5BC",
                  fontWeight: 400,
                  textAlign: "left",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                  zIndex: 10,
                }}
              >
                {tooltip}
              </span>
            )}
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.5, color: "#8A9AA2", maxWidth: 140 }}>
        {description}
      </div>
    </button>
  );
});

export default ObservationTypeCard;
