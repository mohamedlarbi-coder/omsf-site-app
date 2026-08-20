import { useMemo } from "react";

/* ---------------------------------------------------------------------------
   Multi-line monthly trend. One coloured line per row of the table above it.

   Scale, tick values and point positions are all computed from the data — add
   a month or a category and the chart adapts without a code change.

   `firstLive` draws the boundary between the historical summary data and
   records captured in the app. The two are not strictly comparable, so the
   break is shown rather than smoothed over.
--------------------------------------------------------------------------- */

/* Default geometry is tuned for the desktop grid. `narrow` re-proportions it
   for a phone: a smaller viewBox means less downscaling, so axis text stays
   legible instead of rendering at 6px. */
const TOP = 20;
const BASE = 160;

function niceMax(v) {
  if (v <= 5) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * mag >= v) return step * mag;
  }
  return 10 * mag;
}

export default function GshTrendChart({
  rows,
  labels,
  through,
  firstLive = -1,
  narrow = false,
}) {
  const W = narrow ? 360 : 680;
  const H = narrow ? 200 : 185;
  const PAD_L = narrow ? 28 : 40;
  const PAD_R = narrow ? 14 : 40;
  const FS_TICK = narrow ? 13 : 9.5;
  const FS_AXIS = narrow ? 14 : 10.5;
  const FS_NOTE = narrow ? 12 : 9;
  const STROKE = narrow ? 3.2 : 2.5;
  const { series, xs, ticks, count } = useMemo(() => {
    let n = through ?? labels.length;
    n = Math.max(2, Math.min(n, labels.length));

    const peak = Math.max(1, ...rows.flatMap((r) => r.values.slice(0, n)));
    const max = niceMax(peak);

    const step = (W - PAD_L - PAD_R) / (n - 1);
    const xPos = Array.from({ length: n }, (_, i) => PAD_L + i * step);
    const y = (v) => BASE - (v / max) * (BASE - TOP);

    const tickVals = [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f)))];

    return {
      count: n,
      xs: xPos,
      ticks: tickVals.map((v) => ({ v, y: y(v) })),
      series: rows.map((r) => ({
        ...r,
        points: r.values.slice(0, n).map((v, i) => `${xPos[i]},${y(v)}`).join(" "),
        lastY: y(r.values[n - 1]),
        lastValue: r.values[n - 1],
        isFlat: r.values.slice(0, n).every((v) => v === 0),
      })),
    };
  }, [rows, labels, through, W, PAD_L, PAD_R]);

  /* Only dot the lines readable at the right edge — otherwise they overlap. */
  const marked = [...series]
    .filter((s) => !s.isFlat)
    .sort((a, b) => b.lastValue - a.lastValue)
    .slice(0, 4)
    .map((s) => s.code);

  const boundaryX =
    firstLive > 0 && firstLive < count ? (xs[firstLive - 1] + xs[firstLive]) / 2 : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label={`Monthly trend, ${series.length} categories`}
      >
        {ticks.map((t) => (
          <g key={t.v}>
            <line
              x1={PAD_L}
              y1={t.y}
              x2={W - PAD_R + 5}
              y2={t.y}
              stroke={t.v === 0 ? "rgba(160,190,204,0.22)" : "rgba(160,190,204,0.07)"}
            />
            <text x={PAD_L - 7} y={t.y + 3} fontSize={FS_TICK} fill="#5C6870" textAnchor="end">
              {t.v}
            </text>
          </g>
        ))}

        {boundaryX !== null && (
          <g>
            <line
              x1={boundaryX}
              y1={TOP - 8}
              x2={boundaryX}
              y2={BASE}
              stroke="rgba(224,168,15,0.55)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text x={boundaryX + 5} y={TOP - 2} fontSize={FS_NOTE} fill="#E0A80F" fontWeight="600">
              {narrow ? "app data" : "app capture begins"}
            </text>
          </g>
        )}

        {series.map((s) => (
          <polyline
            key={s.code}
            points={s.points}
            fill="none"
            stroke={s.colour}
            strokeWidth={s.isFlat ? STROKE * 0.6 : STROKE}
            strokeDasharray={s.isFlat ? "4 4" : undefined}
            strokeOpacity={s.isFlat ? 0.35 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {series
          .filter((s) => marked.includes(s.code))
          .map((s) => (
            <circle key={s.code} cx={xs[count - 1]} cy={s.lastY} r={narrow ? 5 : 4.2} fill={s.colour} />
          ))}

        {labels.slice(0, count).map((l, i) => (
          <text key={l} x={xs[i]} y={H - 6} fontSize={FS_AXIS} fill="#8A9198" textAnchor="middle">
            {l}
          </text>
        ))}
      </svg>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 11,
          marginTop: 12,
          color: "#8A9198",
          fontSize: narrow ? 12 : 10.5,
        }}
      >
        {series.map((s) => (
          <span key={s.code} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <i
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: s.colour,
                opacity: s.isFlat ? 0.35 : 1,
                flex: "none",
              }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
