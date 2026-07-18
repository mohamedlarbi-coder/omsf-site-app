import React, { useRef } from "react";
import { ThumbsUp, TriangleAlert, Lightbulb } from "lucide-react";
import ObservationTypeCard from "./ObservationTypeCard";

const TYPES = [
  {
    value: "good-spot",
    icon: ThumbsUp,
    iconColor: "#18D0C8",
    iconFill: "#18D0C8",
    glow: "none",
    title: "Good Spot",
    description: "Positive behavior or condition",
    tooltip: "Recognition of safe work practices, proactive actions or positive site conditions that improve safety.",
  },
  {
    value: "hazard",
    icon: TriangleAlert,
    iconColor: "#F2A619",
    iconFill: "none",
    glow: "none",
    title: "Hazard",
    description: "Unsafe condition or behavior",
    tooltip: "A hazard or unsafe act with the potential to cause injury, property damage or environmental impact.",
  },
  {
    value: "close-call",
    icon: TriangleAlert,
    iconColor: "#F2A619",
    iconFill: "none",
    glow: "none",
    title: "Close Call",
    description: "Incident with no injury or damage",
    tooltip: "An unplanned event where no injury or damage occurred but where the outcome could easily have been much more serious.",
  },
  {
    value: "ofi",
    icon: Lightbulb,
    iconColor: "#D8E0E4",
    iconFill: "none",
    glow: "none",
    title: "OFI",
    description: "Opportunity for improvement",
    tooltip: "A recommendation to improve safety, quality, efficiency, coordination or operational performance before problems occur.",
  },
];

/* Unified 4-section panel: one shared bordered/rounded container split
   into 4 equal columns by thin dividers — matching the approved
   reference exactly, rather than 4 separate floating cards. */
export default function ObservationTypeGrid({ selectedType, onSelectType }) {
  const cardRefs = useRef([]);

  function focusAndSelect(index) {
    const wrapped = (index + TYPES.length) % TYPES.length;
    onSelectType(TYPES[wrapped].value);
    cardRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(e, index) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusAndSelect(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusAndSelect(index - 1);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Observation type"
      style={{
        display: "flex",
        background: "linear-gradient(150deg, rgba(18, 39, 49, 0.98), rgba(10, 25, 34, 0.98))",
        border: "1px solid rgba(160, 190, 204, 0.19)",
        borderRadius: 15,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.025), 0 10px 24px rgba(0, 0, 0, 0.13)",
        overflow: "hidden",
      }}
      className="minervium-obs-type-grid"
    >
      {TYPES.map((t, i) => (
        <ObservationTypeCard
          key={t.value}
          ref={(el) => (cardRefs.current[i] = el)}
          icon={t.icon}
          iconColor={t.iconColor}
          iconFill={t.iconFill}
          glow={t.glow}
          title={t.title}
          description={t.description}
          tooltip={t.tooltip}
          selected={selectedType === t.value}
          onSelect={() => onSelectType(t.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          isLast={i === TYPES.length - 1}
        />
      ))}
    </div>
  );
}
