import React, { useRef } from "react";
import { MapPin } from "lucide-react";
import Dropdown from "./Dropdown";

const LOCATION_OPTIONS = [
  "Area 1 – Control Rooms",
  "Area 2 – Duct Bank",
  "Area 3 – Deep Pits",
  "Area 4 – Buggy Pits",
  "Area 5 – Train Wash",
];

/* Location dropdown + tap-to-place pin on the shared site map image.
   siteMapUrl is the team's uploaded site plan (same shared asset the
   mobile app uses) — pass it down from wherever that's loaded. If none
   is available yet, shows a placeholder instead of a blank box. */
export default function ObservationMapPicker({ location, onLocationChange, pin, onPinChange, siteMapUrl }) {
  const imgRef = useRef(null);

  function handleMapClick(e) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onPinChange({ x, y });
  }

  return (
    <div>
      <Dropdown
        label="Add Location"
        value={location}
        onChange={onLocationChange}
        options={LOCATION_OPTIONS}
        placeholder="Select a location…"
      />

      <div
        onClick={siteMapUrl ? handleMapClick : undefined}
        style={{
          marginTop: 14,
          height: 220,
          borderRadius: 12,
          border: "1px solid rgba(160, 190, 204, 0.19)",
          background: "#0D1B25",
          position: "relative",
          overflow: "hidden",
          cursor: siteMapUrl ? "crosshair" : "default",
        }}
      >
        {siteMapUrl ? (
          <img ref={imgRef} src={siteMapUrl} alt="Site map" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} draggable={false} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#5C6870" }}>
            <MapPin size={22} />
            <span style={{ fontSize: 12.5 }}>No site map uploaded yet</span>
          </div>
        )}

        {pin && siteMapUrl && (
          <div
            style={{
              position: "absolute",
              left: `${pin.x * 100}%`,
              top: `${pin.y * 100}%`,
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
            }}
          >
            <MapPin size={30} color="#18C9CB" fill="#18C9CB" strokeWidth={1.5} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }} />
          </div>
        )}
      </div>
    </div>
  );
}
