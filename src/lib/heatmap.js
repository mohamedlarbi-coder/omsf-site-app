/* ---------------------------------------------------------------------------
   Shared hazard-density heat map renderer.

   Two-pass canvas technique (same idea as the simpleheat.js library):
     1. Draw a soft radial blob per point, additively ("lighter"), onto an
        internal-resolution canvas. Overlapping points accumulate alpha —
        that is the density signal.
     2. Re-colour every pixel by its accumulated alpha through a cold→hot
        gradient lookup table, so denser clusters read as hotter.

   Used by both the dashboard widget (DashboardProjectMap) and the full-page
   view (DashboardProjectMapPage) so the two can never drift apart.
--------------------------------------------------------------------------- */

// Cold → hot, kept inside the app's existing teal/amber/red vocabulary
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

/** Draws the heat map for `points` ({x,y} in [0,1]) onto `canvas`, whose
 *  `width`/`height` attributes set the internal render resolution. */
export function drawHeat(canvas, points, pointRadius = 42) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  if (!points.length) return;

  const template = ctx.createRadialGradient(0, 0, 0, 0, 0, pointRadius);
  template.addColorStop(0, "rgba(255,255,255,0.5)");
  template.addColorStop(1, "rgba(255,255,255,0)");

  points.forEach((p) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(p.x * w, p.y * h);
    ctx.fillStyle = template;
    ctx.beginPath();
    ctx.arc(0, 0, pointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const img = ctx.getImageData(0, 0, w, h);
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

export function isValidPin(pin) {
  return (
    pin &&
    typeof pin.x === "number" &&
    typeof pin.y === "number" &&
    pin.x >= 0 &&
    pin.x <= 1 &&
    pin.y >= 0 &&
    pin.y <= 1
  );
}
