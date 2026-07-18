import React, { useState } from "react";
import { X } from "lucide-react";
import ObservationStepper from "./ObservationStepper";
import PhotoThumbnailGrid from "./PhotoThumbnailGrid";
import ObservationMapPicker from "./ObservationMapPicker";
import WorkflowFooter from "./WorkflowFooter";

/* MINERVIUM — New Observation, Step 3: Media.
   Photos and the site-map pin are both optional — Next stays enabled
   regardless, matching the reference (no required fields on this step). */
export default function NewObservationMediaPage({ initialDraft, onCancel, onBack, onAdvance, isModal = false, siteMapUrl }) {
  const [draft, setDraft] = useState({
    photos: [],
    mediaLocation: initialDraft?.location || "",
    mapPin: null,
    ...initialDraft,
  });

  function setField(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
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

        <ObservationStepper currentStep={3} />

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#F1F5F6", marginBottom: 16, marginTop: 0 }}>
              Add Photos
            </h2>
            <PhotoThumbnailGrid photos={draft.photos} onChange={(photos) => setField("photos", photos)} />
          </div>

          <div>
            <ObservationMapPicker
              location={draft.mediaLocation}
              onLocationChange={(v) => setField("mediaLocation", v)}
              pin={draft.mapPin}
              onPinChange={(pin) => setField("mapPin", pin)}
              siteMapUrl={siteMapUrl}
            />
          </div>
        </div>

        <WorkflowFooter
          onCancel={() => onBack(draft)}
          onNext={() => onAdvance(draft)}
          nextEnabled={true}
          cancelLabel="Back"
          nextLabel="Next"
        />
      </div>
    </div>
  );
}
