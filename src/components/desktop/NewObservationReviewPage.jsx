import React, { useState } from "react";
import { X, TriangleAlert, ThumbsUp, Lightbulb } from "lucide-react";
import ObservationStepper from "./ObservationStepper";
import WorkflowFooter from "./WorkflowFooter";

const TYPE_META = {
  "good-spot": { label: "Good Spot", icon: ThumbsUp, color: "#18D0C8" },
  "hazard": { label: "Hazard", icon: TriangleAlert, color: "#F2A619" },
  "close-call": { label: "Close Call", icon: TriangleAlert, color: "#F2A619" },
  "ofi": { label: "OFI", icon: Lightbulb, color: "#D8E0E4" },
};

function ReviewRow({ label, children, isLast }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: "16px 22px",
        borderBottom: isLast ? "none" : "1px solid rgba(160, 190, 204, 0.12)",
      }}
    >
      <div style={{ width: 140, flexShrink: 0, fontSize: 13.5, color: "#8A9198" }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14.5, color: "#F1F5F6", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

/* MINERVIUM — New Observation, Step 4: Review & Submit.
   The final step: shows a read-only summary of everything collected
   across Steps 1-3, then submits the observation. onSubmit(draft) is
   called when the user confirms — wire this to the actual save/insert
   logic (e.g. Supabase) wherever this page is used. */
export default function NewObservationReviewPage({ draft, onCancel, onBack, onSubmit, isModal = false }) {
  const [submitting, setSubmitting] = useState(false);
  const typeMeta = TYPE_META[draft.type] || TYPE_META["hazard"];
  const TypeIcon = typeMeta.icon;

  async function handleSubmit() {
    setSubmitting(true);
    await onSubmit(draft);
    setSubmitting(false);
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
            Review &amp; Submit
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

        <ObservationStepper currentStep={4} />

        <div
          style={{
            background: "linear-gradient(150deg, rgba(18, 39, 49, 0.98), rgba(10, 25, 34, 0.98))",
            border: "1px solid rgba(160, 190, 204, 0.19)",
            borderRadius: 15,
            overflow: "hidden",
          }}
        >
          <ReviewRow label="Type">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <TypeIcon size={16} color={typeMeta.color} />
              {typeMeta.label}
            </span>
          </ReviewRow>
          <ReviewRow label="Title">{draft.title || "—"}</ReviewRow>
          <ReviewRow label="Location">{draft.location || "—"}</ReviewRow>
          <ReviewRow label="Tracking Type">{draft.trackingType || "—"}</ReviewRow>
          <ReviewRow label="Hazard Class">{draft.hazardClass || "—"}</ReviewRow>
          <ReviewRow label="Description">{draft.description || "—"}</ReviewRow>
          <ReviewRow label="Photos" isLast>
            {draft.photos && draft.photos.length > 0 ? (
              <div style={{ display: "flex", gap: 10 }}>
                {draft.photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Photo ${i + 1}`}
                    style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(160, 190, 204, 0.19)" }}
                  />
                ))}
              </div>
            ) : (
              <span style={{ color: "#5C6870" }}>No photos attached</span>
            )}
          </ReviewRow>
        </div>

        <WorkflowFooter
          onCancel={() => onBack(draft)}
          onNext={handleSubmit}
          nextEnabled={!submitting}
          cancelLabel="Back"
          nextLabel={submitting ? "Submitting…" : "Submit Observation"}
        />
      </div>
    </div>
  );
}
