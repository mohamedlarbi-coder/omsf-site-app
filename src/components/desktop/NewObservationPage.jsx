import React, { useState } from "react";
import { X } from "lucide-react";
import ObservationStepper from "./ObservationStepper";
import ObservationTypeGrid from "./ObservationTypeGrid";
import WorkflowFooter from "./WorkflowFooter";

/*
  ObservationDraft shape (kept as a plain JS object; add JSDoc types if
  the project adopts TypeScript later):

  {
    type: "good-spot" | "hazard" | "close-call" | "ofi" | null,
    title: string,
    description: string,
    location: string,
    trackingType: string,
    hazardClass: string,
    photos: string[],
  }
*/

function emptyDraft() {
  return {
    type: null,
    title: "",
    description: "",
    location: "",
    trackingType: "",
    hazardClass: "",
    photos: [],
  };
}

/* MINERVIUM — New Observation, Step 1: Type.
   Renders only the Type-selection step. onAdvance(draft) is called with
   the updated draft when the user proceeds to Step 2 (Details) — wire
   this to whatever routing/step-management the surrounding app uses.
   onCancel() is called when the user cancels out of the workflow. */
export default function NewObservationPage({ onCancel, onAdvance, isModal = false, initialDraft }) {
  const [draft, setDraft] = useState(initialDraft || emptyDraft());

  function handleSelectType(value) {
    setDraft((d) => ({ ...d, type: value }));
  }

  function handleNext() {
    if (!draft.type) return;
    onAdvance(draft);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(17, 205, 205, 0.055), transparent 36%), linear-gradient(145deg, #061018, #02090f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          minWidth: 320,
          minHeight: 640,
          background: "#091720",
          border: "1px solid rgba(155, 190, 205, 0.16)",
          borderRadius: 18,
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.025)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 34 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#F1F5F6",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            New Observation
          </h1>
          {isModal && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                color: "#73828B",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "flex",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#14C9CB")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#73828B")}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Stepper */}
        <ObservationStepper currentStep={1} />

        {/* Section heading */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#F1F5F6",
            marginBottom: 20,
            marginTop: 0,
          }}
        >
          Select Observation Type
        </h2>

        {/* Type grid */}
        <ObservationTypeGrid selectedType={draft.type} onSelectType={handleSelectType} />

        {/* Footer */}
        <WorkflowFooter onCancel={onCancel} onNext={handleNext} nextEnabled={!!draft.type} />
      </div>
    </div>
  );
}
