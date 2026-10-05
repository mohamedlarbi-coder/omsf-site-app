import React, { useEffect, useMemo, useRef } from "react";
import { MapPin } from "lucide-react";

/* ---------------------------------------------------------------------------
   Project Map — hazard density heat map.

   Replaces the earlier static 5-box mock (which wasn't tied to any real
   data) with an actual heat overlay on the team's real site map image,
   built from every report's dropped pin (report.map_pin, set in
   ObservationMapPicker: normalized {x, y} in [0,1]).

   Canvas technique (same two-pass idea as the simpleheat.js library):
     1. Draw a soft radial blob per pin, additively ("lighter"), onto an
        off-screen-resolution canvas. Overlapping pins accumulate alpha —
        that's the density signal.
     2. Re-colour every pixel by its accumulated alpha through a cold→hot
        gradient lookup table, so denser clusters read as hotter.

   No charting/heatmap dependency needed for ~a few hundred points at most.
--------------------------------------------------------------------------- */

const CANVAS_W = 640;
const CANVAS_H = 200;
const POINT_RADIUS = 42;

// Cold → hot. Kept inside the app's existing teal/amber/red vocabulary
// (teal = calm, amber = caution, red = danger) rather than a generic
// rainbow scale.
const GRADIENT_STOPS = [
  { stop: 0.0, color: [8, 19, 29, 0] },
  { stop: 0.25, color: [24, 140, 198, 130] },
  { stop: 0.5, color: [24, 201, 198, 190] },
  { stop: 0.75, color: [224, 168, 15, 225] },
  { stop: 1.0, color: [220, 38, 38, 255] },
];

function buildGradientLUT() {
  const lut = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = GRADIENT_STOPS[0];
    let b = GRADIENT_STOPS[GRADIENT_STOPS.length - 1];
    for (let s = 0; s < GRADIENT_STOPS.length - 1; s++) {
      if (t >= GRADIENT_STOPS[s].stop && t <= GRADIENT_STOPS[s + 1].stop) {
        a = GRADIENT_STOPS[s];
        b = GRADIENT_STOPS[s + 1];
        break;
      }
    }
    const span = b.stop - a.stop || 1;
    const f = (t - a.stop) / span;
    for (let c = 0; c < 4; c++) {
      lut[i * 4 + c] = a.color[c] + (b.color[c] - a.color[c]) * f;
    }
  }
  return lut;
}

const GRADIENT_LUT = buildGradientLUT();

function drawHeat(canvas, points) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (!points.length) return;

  const template = ctx.createRadialGradient(0, 0, 0, 0, 0, POINT_RADIUS);
  template.addColorStop(0, "rgba(255,255,255,0.5)");
  template.addColorStop(1, "rgba(255,255,255,0)");

  points.forEach((p) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(p.x * CANVAS_W, p.y * CANVAS_H);
    ctx.fillStyle = template;
    ctx.beginPath();
    ctx.arc(0, 0, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    const lutIdx = a * 4;
    data[i] = GRADIENT_LUT[lutIdx];
    data[i + 1] = GRADIENT_LUT[lutIdx + 1];
    data[i + 2] = GRADIENT_LUT[lutIdx + 2];
    data[i + 3] = GRADIENT_LUT[lutIdx + 3];
  }
  ctx.putImageData(img, 0, 0);
}

function isValidPin(pin) {
  return pin && typeof pin.x === "number" && typeof pin.y === "number" &&
    pin.x >= 0 && pin.x <= 1 && pin.y >= 0 && pin.y <= 1;
}

export default function DashboardProjectMap({ reports = [], siteMapUrl, onViewFullMap }) {
  const canvasRef = useRef(null);

  const points = useMemo(
    () => reports.filter((r) => isValidPin(r.map_pin)).map((r) => r.map_pin),
    [reports]
  );

  useEffect(() => {
    if (canvasRef.current) drawHeat(canvasRef.current, points);
  }, [points]);

  return (
    <div style={{ background: "#0d1b26", border: "1px solid rgba(160, 190, 204, 0.14)", borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>Project Map</div>
          <div style={{ fontSize: 11, color: "#8A9198", marginTop: 2 }}>
            {points.length > 0
              ? `Hazard density from ${points.length} pinned report${points.length === 1 ? "" : "s"}`
              : "No pinned reports yet"}
          </div>
        </div>
        <button onClick={onViewFullMap} style={{ background: "none", border: "none", color: "#18C9CB", fontSize: 12, cursor: "pointer" }}>
          View full map ›
        </button>
      </div>

      <div
        style={{
          position: "relative",
          height: 180,
          backgroundColor: "#08131D",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {siteMapUrl ? (
          <img
            src={siteMapUrl}
            alt="Site map"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(24,213,208,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(24,213,208,0.06) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.88 }}
        />

        {!siteMapUrl && (
          <div
            style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6, color: "#5C6870",
            }}
          >
            <MapPin size={20} />
            <span style={{ fontSize: 11.5 }}>No site map uploaded yet</span>
          </div>
        )}

        {siteMapUrl && points.length === 0 && (
          <div
            style={{
              position: "absolute", left: 10, bottom: 10, right: 10,
              background: "rgba(8,19,29,0.7)", borderRadius: 8, padding: "6px 10px",
              color: "#8A9198", fontSize: 10.5, textAlign: "center",
            }}
          >
            Heat will build up here as crews pin hazards on the map when filing reports.
          </div>
        )}
      </div>

      {points.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "#8A9198" }}>Fewer</span>
          <div
            style={{
              flex: 1, height: 6, borderRadius: 3,
              background: "linear-gradient(90deg, #188CC6, #18C9C6, #E0A80F, #DC2626)",
            }}
          />
          <span style={{ fontSize: 10, color: "#8A9198" }}>More</span>
        </div>
      )}
    </div>
  );
}
