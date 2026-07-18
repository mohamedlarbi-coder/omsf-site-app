import React, { useState } from "react";
import { X } from "lucide-react";
import ObservationStepper from "./ObservationStepper";
import ObservationTitleField from "./ObservationTitleField";
import ObservationDescriptionField from "./ObservationDescriptionField";
import Dropdown from "./Dropdown";
import WorkflowFooter from "./WorkflowFooter";
import { fieldStyle } from "./fieldStyles";

const LOCATION_OPTIONS = [
  "Area 1 – Control Rooms",
  "Area 2 – Duct Bank",
  "Area 3 – Deep Pits",
  "Area 4 – Buggy Pits",
  "Area 5 – Train Wash",
];

const TRACKING_TYPE_OPTIONS = [
  "Fall hazard", "PPE", "Housekeeping", "Access Egress/Control Zone", "Moving Objects",
  "Drop Objects", "Mobile Equip", "Doc/Policy", "Tools", "Others",
];

const HAZARD_CLASS_OPTIONS = [
  "Physical", "Chemical", "Biological", "Ergonomic", "Safety",
  "Life-Saving Rule", "Legislative", "Environmental", "Psychosocial", "Others",
];

const SUBCONTRACTOR_OPTIONS = ["GIP", "Outspan", "Structform", "Sylvan", "Smith & Long", "Others"];

const MIN_DESCRIPTION_LENGTH = 20;

function validate(draft) {
  const errors = {};
  if (!draft.title.trim()) errors.title = "Title is required";
  if (!draft.location) errors.location = "Location is required";
  if (draft.description.trim().length < MIN_DESCRIPTION_LENGTH) errors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
  if (!draft.trackingType) errors.trackingType = "Tracking type is required";
  else if (draft.trackingType === "Others" && !draft.trackingTypeOther?.trim()) errors.trackingType = "Please specify the tracking type";
  return errors;
}

/* MINERVIUM — New Observation, Step 2: Details.
   onBack(draft) returns to Step 1 with the current draft preserved.
   onAdvance(draft) proceeds to Step 3 (Media) once validation passes. */
export default function NewObservationDetailsPage({ initialDraft, onCancel, onBack, onAdvance, isModal = false }) {
  const [draft, setDraft] = useState({
    title: "",
    location: "",
    description: "",
    subcontractor: "",
    subcontractorOther: "",
    trackingType: "",
    trackingTypeOther: "",
    hazardClass: "",
    ...initialDraft,
  });
  const [touched, setTouched] = useState({});
  const [attemptedNext, setAttemptedNext] = useState(false);

  const errors = validate(draft);
  const isValid = Object.keys(errors).length === 0;

  function setField(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function markTouched(key) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function handleNext() {
    setAttemptedNext(true);
    if (isValid) onAdvance(draft);
  }

  function shouldShowError(key) {
    return (touched[key] || attemptedNext) && errors[key];
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, rgba(17, 205, 205, 0.055), transparent 36%), linear-gradient(145deg, #061018, #02090f)",
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
          maxWidth: 900,
          minWidth: 320,
          minHeight: 680,
          background: "#091720",
          border: "1px solid rgba(155, 190, 205, 0.16)",
          borderRadius: 18,
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.025)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#F1F5F6", letterSpacing: "-0.02em", margin: 0 }}>
            New Observation
          </h1>
          {isModal && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              style={{ background: "transparent", border: "none", color: "#73828B", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#14C9CB")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#73828B")}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <ObservationStepper currentStep={2} />

        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F1F5F6", marginBottom: 20, marginTop: 0 }}>
          Observation Details
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <ObservationTitleField
            value={draft.title}
            onChange={(v) => setField("title", v)}
            error={shouldShowError("title") ? errors.title : null}
          />

          <div onBlur={() => markTouched("location")}>
            <Dropdown
              label="Location"
              required
              value={draft.location}
              onChange={(v) => setField("location", v)}
              options={LOCATION_OPTIONS}
              placeholder="Select a location…"
              error={shouldShowError("location") ? errors.location : null}
            />
          </div>

          <ObservationDescriptionField
            value={draft.description}
            onChange={(v) => setField("description", v)}
            error={shouldShowError("description") ? errors.description : null}
          />

          <div>
            <Dropdown
              label="Subcontractor"
              value={draft.subcontractor}
              onChange={(v) => { setField("subcontractor", v); setField("subcontractorOther", ""); }}
              options={SUBCONTRACTOR_OPTIONS}
              placeholder="Select subcontractor…"
            />
            {draft.subcontractor === "Others" && (
              <input
                type="text"
                value={draft.subcontractorOther}
                onChange={(e) => setField("subcontractorOther", e.target.value)}
                placeholder="Please specify the subcontractor…"
                style={{ ...fieldStyle({}), marginTop: 10 }}
              />
            )}
          </div>

          <div onBlur={() => markTouched("trackingType")}>
            <Dropdown
              label="Tracking Type"
              required
              value={draft.trackingType}
              onChange={(v) => setField("trackingType", v)}
              options={TRACKING_TYPE_OPTIONS}
              placeholder="Select tracking type…"
              error={shouldShowError("trackingType") ? errors.trackingType : null}
            />
            {draft.trackingType === "Others" && (
              <input
                type="text"
                value={draft.trackingTypeOther}
                onChange={(e) => setField("trackingTypeOther", e.target.value)}
                placeholder="Please specify the tracking type…"
                style={{ ...fieldStyle({}), marginTop: 10 }}
              />
            )}
          </div>

          <Dropdown
            label="Hazard Class"
            value={draft.hazardClass}
            onChange={(v) => setField("hazardClass", v)}
            options={HAZARD_CLASS_OPTIONS}
            placeholder="Optional…"
          />
        </div>

        <WorkflowFooter
          onCancel={() => onBack(draft)}
          onNext={handleNext}
          nextEnabled={isValid}
          cancelLabel="Back"
          nextLabel="Next"
        />
      </div>
    </div>
  );
}
