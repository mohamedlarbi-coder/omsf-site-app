import React from "react";

export default function WorkflowFooter({ onCancel, onNext, nextEnabled, cancelLabel = "Cancel", nextLabel = "Next" }) {
  const [hoverCancel, setHoverCancel] = React.useState(false);
  const [hoverNext, setHoverNext] = React.useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: 40,
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        onMouseEnter={() => setHoverCancel(true)}
        onMouseLeave={() => setHoverCancel(false)}
        style={{
          height: 42,
          padding: "0 18px",
          background: hoverCancel ? "rgba(255, 255, 255, 0.035)" : "transparent",
          border: `1px solid ${hoverCancel ? "rgba(205, 220, 228, 0.35)" : "rgba(170, 190, 200, 0.22)"}`,
          borderRadius: 9,
          color: hoverCancel ? "#F1F5F6" : "#AAB6BD",
          fontWeight: 550,
          cursor: "pointer",
          transition: "all 200ms ease",
        }}
      >
        {cancelLabel}
      </button>

      <button
        type="button"
        onClick={nextEnabled ? onNext : undefined}
        onMouseEnter={() => setHoverNext(true)}
        onMouseLeave={() => setHoverNext(false)}
        disabled={!nextEnabled}
        style={
          nextEnabled
            ? {
                height: 42,
                minWidth: 96,
                padding: "0 22px",
                background: "linear-gradient(135deg, #1BD5D3, #07949B)",
                border: "1px solid rgba(90, 247, 240, 0.36)",
                borderRadius: 9,
                color: "#031014",
                fontWeight: 650,
                boxShadow: "0 8px 20px rgba(0, 181, 185, 0.18)",
                cursor: "pointer",
                transform: hoverNext ? "translateY(-1px)" : "none",
                filter: hoverNext ? "brightness(1.06)" : "none",
                transition: "all 200ms ease",
              }
            : {
                height: 42,
                minWidth: 96,
                padding: "0 22px",
                background: "#26353D",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 9,
                color: "#677780",
                fontWeight: 650,
                cursor: "not-allowed",
                boxShadow: "none",
              }
        }
      >
        {nextLabel}
      </button>
    </div>
  );
}
