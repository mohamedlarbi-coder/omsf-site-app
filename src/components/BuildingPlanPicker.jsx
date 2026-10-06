import React, { useRef } from "react";
import { MapPin } from "lucide-react";

/* Second, optional pin: the detailed plan of the chosen building
   (e.g. OMSF Maintenance Building). Pin is normalized 0–1 on the plan image. */
export default function BuildingPlanPicker({ plan, pin, onPinChange }) {
  const imgRef = useRef(null);
  if (!plan) return null;

  function handleTap(e) {
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onPinChange({ x, y });
  }

  return (
    <div>
      <div style={{ color: "#F1F5F6", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{plan.label} plan</div>
      <div
        onClick={handleTap}
        style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(160,190,204,0.19)", background: "#fff", cursor: "crosshair", userSelect: "none", lineHeight: 0 }}
      >
        <img ref={imgRef} src={plan.url} alt={plan.label} style={{ width: "100%", height: "auto", display: "block" }} draggable={false} />
        {pin && (
          <div style={{ position: "absolute", left: `${pin.x * 100}%`, top: `${pin.y * 100}%`, transform: "translate(-50%, -100%)", pointerEvents: "none" }}>
            <MapPin size={30} color="#dc2626" fill="#dc2626" strokeWidth={1.5} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          </div>
        )}
      </div>
      <div style={{ color: "#73828B", fontSize: 12, marginTop: 6 }}>
        {pin ? "Tap the plan to move the pin" : "Tap the plan to mark the exact area inside the building"}
      </div>
    </div>
  );
}
