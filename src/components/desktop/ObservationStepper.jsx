import React from "react";
import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Type" },
  { n: 2, label: "Details" },
  { n: 3, label: "Media" },
  { n: 4, label: "Review" },
];

/* Horizontal 4-step progress indicator.
   currentStep is 1-indexed (1 = Type, 2 = Details, etc).
   Completed steps (n < currentStep) show an aqua-outlined circle with
   a checkmark. The active step shows a filled aqua circle with its
   number. Future steps are grey. */
export default function ObservationStepper({ currentStep = 1 }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
        {/* connecting line, behind circles */}
        <div
          style={{
            position: "absolute",
            top: 15,
            left: "12.5%",
            right: "12.5%",
            height: 2,
            background: "#2B3942",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 15,
            left: "12.5%",
            width: currentStep > 1 ? `${((currentStep - 1) / (STEPS.length - 1)) * 75}%` : 0,
            height: 2,
            background: "linear-gradient(90deg, #12D2D2, #087D84)",
            zIndex: 1,
            transition: "width 150ms ease",
          }}
        />

        {STEPS.map((step) => {
          const isActive = step.n === currentStep;
          const isComplete = step.n < currentStep;

          let circleStyle = {
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 650,
          };

          if (isActive) {
            circleStyle = {
              ...circleStyle,
              background: "linear-gradient(145deg, #1BD7D8, #0BA4AA)",
              color: "#031014",
              border: "1px solid rgba(76, 246, 242, 0.8)",
              boxShadow: "0 0 0 4px rgba(20, 201, 203, 0.08), 0 0 20px rgba(20, 201, 203, 0.26)",
            };
          } else if (isComplete) {
            circleStyle = {
              ...circleStyle,
              background: "linear-gradient(145deg, #1BD7D8, #0BA4AA)",
              color: "#031014",
              border: "1px solid rgba(76, 246, 242, 0.8)",
            };
          } else {
            circleStyle = {
              ...circleStyle,
              background: "#35434D",
              color: "#D0D7DB",
              border: "1px solid rgba(255, 255, 255, 0.07)",
            };
          }

          return (
            <div key={step.n} style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={circleStyle}>
                {isComplete ? <Check size={15} strokeWidth={2.5} /> : step.n}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 550,
                  color: isActive ? "#F4F8F8" : "#8E9AA2",
                }}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
