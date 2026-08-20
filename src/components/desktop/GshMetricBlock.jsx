import GshTrendChart from "./GshTrendChart";
import { MONTH_LABELS } from "../../lib/gshRollup";

/* ---------------------------------------------------------------------------
   One grid of the Key Metric Dashboard: the twelve-month table, then the same
   data as one line per row.

   Totals are summed from the rows on screen, so the footer can never disagree
   with the cells above it.
--------------------------------------------------------------------------- */

const cell = {
  padding: "7px 6px",
  borderBottom: "1px solid rgba(160,190,204,0.07)",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const head = {
  padding: "0 6px 8px",
  borderBottom: "1px solid rgba(160,190,204,0.16)",
  color: "#8A9198",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  textAlign: "right",
  whiteSpace: "nowrap",
};

export default function GshMetricBlock({
  title,
  subtitle,
  matrix,
  currentMonth,
  firstLive = -1,
  note,
  narrow = false,
}) {
  const { rows, totals, grandTotal } = matrix;

  const peaks = rows.map((r) => {
    const max = Math.max(...r.values);
    return max > 0 ? r.values.indexOf(max) : -1;
  });

  const cellStyle = (value, mi, peakIndex) => {
    const s = { ...cell };
    if (mi > currentMonth) s.color = "rgba(138,145,152,0.3)";
    else if (value === 0) s.color = "rgba(138,145,152,0.45)";
    if (mi === peakIndex && value > 0 && mi !== currentMonth) {
      s.color = "#E0A80F";
      s.fontWeight = 700;
    }
    if (mi === currentMonth) {
      s.background = "rgba(24,201,203,0.13)";
      s.fontWeight = 700;
      s.color = s.color === "rgba(138,145,152,0.45)" ? "rgba(138,145,152,0.7)" : "#FFFFFF";
    }
    return s;
  };

  return (
    <section
      style={{
        background: "#0d1b26",
        border: "1px solid rgba(160,190,204,0.14)",
        borderRadius: 12,
        padding: narrow ? 12 : 16,
        minWidth: 0,
      }}
    >
      <h3 style={{ margin: "0 0 11px", fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
        {title}
        {subtitle && <span style={{ color: "#8A9198", fontWeight: 400 }}> · {subtitle}</span>}
      </h3>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 840 }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: "left", minWidth: 150 }}>{title}</th>
              {MONTH_LABELS.map((m) => (
                <th key={m} style={head}>{m}</th>
              ))}
              <th style={{ ...head, color: "#25E0DE" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.code}>
                <td style={{ ...cell, textAlign: "left", color: "#D5D8DC" }}>
                  {r.label}
                </td>
                {r.values.map((v, mi) => (
                  <td key={mi} style={cellStyle(v, mi, peaks[ri])}>{v}</td>
                ))}
                <td style={{ ...cell, color: "#25E0DE", fontWeight: 700 }}>{r.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                style={{
                  ...cell,
                  textAlign: "left",
                  borderTop: "1px solid rgba(160,190,204,0.16)",
                  borderBottom: 0,
                  paddingTop: 9,
                  fontWeight: 800,
                  color: "#FFFFFF",
                }}
              >
                Total
              </td>
              {totals.map((v, mi) => (
                <td
                  key={mi}
                  style={{
                    ...cellStyle(v, mi, -1),
                    borderTop: "1px solid rgba(160,190,204,0.16)",
                    borderBottom: 0,
                    paddingTop: 9,
                    fontWeight: 800,
                  }}
                >
                  {v}
                </td>
              ))}
              <td
                style={{
                  ...cell,
                  borderTop: "1px solid rgba(160,190,204,0.16)",
                  borderBottom: 0,
                  paddingTop: 9,
                  color: "#25E0DE",
                  fontWeight: 800,
                }}
              >
                {grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 15,
          borderTop: "1px solid rgba(160,190,204,0.1)",
        }}
      >
        <GshTrendChart
          rows={rows}
          labels={MONTH_LABELS}
          through={currentMonth + 1}
          firstLive={firstLive}
          narrow={narrow}
        />
      </div>

      {note && (
        <p
          style={{
            margin: "13px 0 0",
            padding: "10px 12px",
            borderRadius: 9,
            border: "1px solid rgba(224,168,15,0.26)",
            background: "rgba(224,168,15,0.06)",
            color: "rgba(255,236,214,0.88)",
            fontSize: 11.5,
            lineHeight: 1.5,
          }}
        >
          {note}
        </p>
      )}
    </section>
  );
}
