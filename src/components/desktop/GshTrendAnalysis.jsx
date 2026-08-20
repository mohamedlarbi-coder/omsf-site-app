import React, { useMemo } from "react";
import { MONTH_LABELS } from "../../lib/gshRollup";

/* MINERVIUM — trend analysis.

   Four charts that answer questions the twelve-month tables cannot:

     Cumulative      the pace of reporting, not just the level
     Event mix       whether the composition is stable as volume moves
     Class mix       Safety share has climbed from 59% to 77% since January
     Factor movement each factor's position in two months, side by side

   Deliberately excluded: a stacked column of monthly volume, and a
   top-three-factor line. Both restate what the line charts under the tables
   already show, and a dashboard that says the same thing twice teaches people
   to skim it.

   Every value is derived from the matrices; nothing is hardcoded. */

const PANEL = {
  background: "rgba(2,18,23,0.88)",
  border: "1px solid rgba(20,220,229,0.22)",
  borderRadius: 18,
  padding: 15,
  minWidth: 0,
};

const TITLE = { margin: 0, fontSize: 13, fontWeight: 700, color: "#F5F7F7" };
const CAP = { margin: "4px 0 14px", color: "#9AA5AA", fontSize: 11.5, lineHeight: 1.45 };

export default function GshTrendAnalysis({
  eventMatrix,
  classMatrix,
  factorMatrix,
  currentMonth,
  narrow = false,
}) {
  const n = currentMonth + 1;

  return (
    <div style={{ display: "grid", gap: 13 }}>
      <CumulativeChart matrix={eventMatrix} months={n} narrow={narrow} />

      <div
        style={{
          display: "grid",
          gap: 13,
          gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
        }}
      >
        <MixChart
          title="Event mix · share of month"
          matrix={eventMatrix}
          months={n}
          caption="Composition against a moving total — a flat mix with rising volume means more reporting, not different risk."
        />
        <MixChart
          title="Hazard classification mix"
          matrix={classMatrix}
          months={n}
          caption="Watch the Safety band. A category that swallows the others may be a real narrowing of risk, or the default option on the form."
        />
      </div>

      {n >= 2 && (
        <FactorMovement matrix={factorMatrix} from={currentMonth - 1} to={currentMonth} />
      )}
    </div>
  );
}

/* ---------- Cumulative -------------------------------------------------- */

function CumulativeChart({ matrix, months, narrow }) {
  const { points, area, total, labels, peakNote } = useMemo(() => {
    const running = [];
    let sum = 0;
    for (let i = 0; i < months; i++) {
      sum += matrix.totals[i] || 0;
      running.push(sum);
    }

    const W = narrow ? 360 : 700;
    const H = 175;
    const L = narrow ? 30 : 40;
    const R = narrow ? 16 : 40;
    const BASE = 150;
    const TOP = 26;

    const max = Math.max(1, sum);
    const step = months > 1 ? (W - L - R) / (months - 1) : 0;
    const x = (i) => L + i * step;
    const y = (v) => BASE - (v / max) * (BASE - TOP);

    const pts = running.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const last = months - 1;

    // Which two consecutive months added the most.
    let bestPair = 0;
    let bestIdx = 0;
    for (let i = 1; i < months; i++) {
      const pair = (matrix.totals[i] || 0) + (matrix.totals[i - 1] || 0);
      if (pair > bestPair) { bestPair = pair; bestIdx = i; }
    }

    return {
      points: pts,
      area: `M${x(0)},${BASE} L${pts.split(" ").join(" L")} L${x(last)},${BASE} Z`,
      total: sum,
      labels: { W, H, L, R, BASE, x, y, last, lastY: y(sum) },
      peakNote:
        months >= 2 && sum > 0
          ? `${MONTH_LABELS[bestIdx - 1]}–${MONTH_LABELS[bestIdx]} added ${bestPair} events — ` +
            `${Math.round((bestPair / sum) * 100)}% of the year in two months.`
          : null,
    };
  }, [matrix, months, narrow]);

  const { W, H, L, BASE, x, lastY } = labels;

  return (
    <div style={PANEL}>
      <h3 style={TITLE}>Cumulative year to date</h3>
      <p style={CAP}>{total} events to end of {MONTH_LABELS[months - 1]}</p>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="mvCum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#13DCE5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#13DCE5" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={L} y1={BASE} x2={W - 20} y2={BASE} stroke="rgba(255,255,255,0.12)" />
        <path d={area} fill="url(#mvCum)" />
        <polyline
          points={points}
          fill="none"
          stroke="#13DCE5"
          strokeWidth={narrow ? 3.2 : 2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={x(months - 1)} cy={lastY} r="5" fill="#13DCE5" />
        <text
          x={x(months - 1)}
          y={lastY - 10}
          textAnchor="end"
          fontSize={narrow ? 15 : 13}
          fontWeight="800"
          fill="#13DCE5"
        >
          {total}
        </text>

        {Array.from({ length: months }, (_, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            fontSize={narrow ? 13 : 10.5}
            fill="#9AA5AA"
            textAnchor="middle"
          >
            {MONTH_LABELS[i]}
          </text>
        ))}
      </svg>

      {peakNote && <p style={{ ...CAP, margin: "10px 0 0" }}>{peakNote}</p>}
    </div>
  );
}

/* ---------- 100% mix ----------------------------------------------------- */

function MixChart({ title, matrix, months, caption }) {
  const rows = matrix.rows.filter((r) =>
    r.values.slice(0, months).some((v) => v > 0)
  );

  return (
    <div style={PANEL}>
      <h3 style={TITLE}>{title}</h3>
      <p style={CAP}>{caption}</p>

      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gap: 8,
          height: 170,
          alignItems: "stretch",
        }}
      >
        {Array.from({ length: months }, (_, mi) => {
          const total = matrix.totals[mi] || 0;
          return (
            <div key={mi} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column-reverse",
                  flex: 1,
                  borderRadius: 5,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {total > 0 &&
                  rows.map((r) =>
                    r.values[mi] > 0 ? (
                      <div
                        key={r.code}
                        style={{
                          flex: r.values[mi],
                          background: r.colour,
                          minHeight: 2,
                        }}
                        title={`${r.label}: ${r.values[mi]}`}
                      />
                    ) : null
                  )}
              </div>
              <span
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  color: "#9AA5AA",
                  fontWeight: 600,
                  marginTop: 6,
                }}
              >
                {MONTH_LABELS[mi]}
              </span>
            </div>
          );
        })}
      </div>

      <Legend rows={rows} />
    </div>
  );
}

/* ---------- Factor movement --------------------------------------------- */

function FactorMovement({ matrix, from, to }) {
  const rows = useMemo(
    () =>
      matrix.rows
        .map((r) => ({
          label: r.label,
          from: r.values[from] || 0,
          to: r.values[to] || 0,
        }))
        .sort((a, b) => b.to - a.to || b.from - a.from),
    [matrix, from, to]
  );

  const max = Math.max(1, ...rows.flatMap((r) => [r.from, r.to]));

  const W = 700;
  const ROW = 26;
  const TOPY = 30;
  const H = TOPY + rows.length * ROW + 26;
  const X0 = 168;
  const X1 = 548;
  const x = (v) => X0 + (v / max) * (X1 - X0);

  const totalFrom = rows.reduce((a, r) => a + r.from, 0);
  const totalTo = rows.reduce((a, r) => a + r.to, 0);

  return (
    <div style={PANEL}>
      <h3 style={TITLE}>
        Factor movement · {MONTH_LABELS[from]} → {MONTH_LABELS[to]}
      </h3>
      <p style={CAP}>
        Where each factor sat in both months. Line length is the size of the shift,
        not whether it is good news — all ten are undesirable.
      </p>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", minWidth: 520, height: "auto", display: "block" }}
        >
          <line x1={X0} y1={16} x2={X0} y2={H - 24} stroke="rgba(255,255,255,0.14)" />

          <text x={600} y={16} fontSize="9.5" fill="#9AA5AA" fontWeight="700" textAnchor="middle">
            {MONTH_LABELS[from].toUpperCase()}
          </text>
          <text x={655} y={16} fontSize="9.5" fill="#13DCE5" fontWeight="700" textAnchor="middle">
            {MONTH_LABELS[to].toUpperCase()}
          </text>

          {rows.map((r, i) => {
            const y = TOPY + i * ROW;
            return (
              <g key={r.label}>
                <text x={156} y={y + 4} fontSize="11.5" fill="rgba(255,255,255,0.85)" textAnchor="end">
                  {r.label}
                </text>
                <line
                  x1={x(r.from)}
                  y1={y}
                  x2={x(r.to)}
                  y2={y}
                  stroke="rgba(20,220,229,0.4)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx={x(r.from)} cy={y} r="5.5" fill="rgba(214,231,236,0.42)" />
                <circle cx={x(r.to)} cy={y} r="5.5" fill="#13DCE5" />
                <text x={600} y={y + 4} fontSize="12" fill="#9AA5AA" textAnchor="middle">
                  {r.from}
                </text>
                <text
                  x={655}
                  y={y + 4}
                  fontSize="12.5"
                  fill="#13DCE5"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {r.to}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 10.5, color: "#9AA5AA" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <i style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(214,231,236,0.42)" }} />
          {MONTH_LABELS[from]}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <i style={{ width: 10, height: 10, borderRadius: "50%", background: "#13DCE5" }} />
          {MONTH_LABELS[to]}
        </span>
      </div>

      <p style={{ ...CAP, margin: "10px 0 0" }}>
        {totalFrom} factors in {MONTH_LABELS[from]}, {totalTo} in {MONTH_LABELS[to]}. When
        overall reporting falls, most factors fall with it — the ones that rise anyway are
        the ones worth discussing.
      </p>
    </div>
  );
}

/* ---------- Shared ------------------------------------------------------- */

function Legend({ rows }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 11,
        marginTop: 12,
        fontSize: 10.5,
        color: "#9AA5AA",
      }}
    >
      {rows.map((r) => (
        <span key={r.code} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <i style={{ width: 10, height: 10, borderRadius: 2, background: r.colour, flex: "none" }} />
          {r.label}
        </span>
      ))}
    </div>
  );
}
