
import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import BackgroundWatermark from "./BackgroundWatermark";
import GshMetricBlock from "./desktop/GshMetricBlock";
import GshTrendAnalysis from "./desktop/GshTrendAnalysis";
import {
  DOMAINS,
  MONTH_LABELS,
  buildYearMatrix,
  fetchMetrics,
  fetchRollup,
  fetchRollupMonths,
  firstLiveMonth,
  lastReportedMonth,
} from "../lib/gshRollup";

/* ---------------------------------------------------------------------------
   GSH KEY METRICS — mobile

   The same four grids as the desktop Analytics page, rendered on a phone.
   The tables keep all twelve months and scroll horizontally inside their own
   card; the page around them stacks. Charts switch to `narrow` geometry — at
   phone width the desktop viewBox scales down about 45%, which would render
   the month labels at roughly 6px.

   Jan–Jul 2026 comes from the monthly GSH report, later months are counted
   from reports filed here. A month is read from one source only.
--------------------------------------------------------------------------- */

const SITES = ["RSSOM", "OMSF", "SUSS"];
const GSH_CODES = ["ofi", "good_spot", "hazard_report"];

export default function GshTrendsView({ reports = [], setView }) {
  const [year] = useState(() => new Date().getFullYear());
  const [site, setSite] = useState("RSSOM");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    setError(null);

    Promise.all([fetchMetrics(), fetchRollup(year), fetchRollupMonths(year)])
      .then(([metrics, rollupRows, isRollupMonth]) => {
        if (live) setData({ metrics, rollupRows, isRollupMonth });
      })
      .catch((e) => {
        if (live) setError(e.message ?? "Could not load GSH history.");
      });

    return () => { live = false; };
  }, [year]);

  const matrices = useMemo(() => {
    if (!data) return null;
    const common = { ...data, reports, site };
    return {
      event: buildYearMatrix({ ...common, domain: DOMAINS.EVENT }),
      klass: buildYearMatrix({ ...common, domain: DOMAINS.CLASS }),
      track: buildYearMatrix({ ...common, domain: DOMAINS.TRACKING }),
      factor: buildYearMatrix({ ...common, domain: DOMAINS.FACTOR }),
    };
  }, [data, reports, site]);

  const currentMonth = matrices ? lastReportedMonth(matrices.event.totals) : -1;
  const firstLive = matrices ? firstLiveMonth(data.isRollupMonth, matrices.event.totals) : -1;

  const siteNote =
    site !== "RSSOM"
      ? "Before app capture this table exists only at project level in the " +
        "source report, so the site filter does not apply to those months."
      : null;

  return (
    <div className="min-h-screen font-sans relative" style={{ background: "#020B0F" }}>
      <BackgroundWatermark />

      <div
        className="relative z-10 mx-auto"
        style={{ maxWidth: 560, paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <header
          className="sticky top-0 z-10"
          style={{
            background: "rgba(4,23,28,0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(20,220,229,0.15)",
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setView("stats")}
              aria-label="Back"
              style={{
                width: 40, height: 40, marginLeft: -6, borderRadius: "50%",
                background: "transparent", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronLeft size={22} color="#9AA5AA" />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, color: "#F5F7F7", fontSize: 17, fontWeight: 700 }}>
                Key Metric Dashboard
              </h1>
              <div style={{ color: "#9AA5AA", fontSize: 11.5, marginTop: 1 }}>
                RSSOM – Ontario Line
                {currentMonth >= 0 && ` · to ${MONTH_LABELS[currentMonth]} ${year}`}
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {SITES.map((s) => (
              <button
                key={s}
                onClick={() => setSite(s)}
                aria-pressed={site === s}
                style={{
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 10,
                  background: site === s ? "rgba(20,220,229,0.13)" : "rgba(2,18,23,0.7)",
                  border: `1px solid ${site === s ? "rgba(20,220,229,0.45)" : "rgba(20,220,229,0.15)"}`,
                  color: site === s ? "#13DCE5" : "#9AA5AA",
                  font: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
          {!data && !error && <p style={{ color: "#9AA5AA", fontSize: 13 }}>Loading…</p>}

          {matrices && currentMonth < 0 && (
            <p style={{ color: "#9AA5AA", fontSize: 13 }}>No GSH data for {year} yet.</p>
          )}

          {matrices && currentMonth >= 0 && (
            <>
              <SummaryCard matrix={matrices.event} currentMonth={currentMonth} />

              {firstLive > 0 && (
                <div
                  style={{
                    margin: "0 0 16px",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(224,168,15,0.26)",
                    background: "rgba(224,168,15,0.06)",
                    color: "rgba(255,236,214,0.88)",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                  }}
                >
                  <b style={{ color: "#E0A80F" }}>
                    Reporting moved into the app in {MONTH_LABELS[firstLive]}.
                  </b>{" "}
                  Earlier months were collected on a desktop form most crews could not
                  reach. A jump at the dashed line is probably easier reporting, not a
                  worse site.
                </div>
              )}

              <div style={{ display: "grid", gap: 14 }}>
                <GshMetricBlock
                  narrow
                  title="Event Type"
                  matrix={matrices.event}
                  currentMonth={currentMonth}
                  firstLive={firstLive}
                  note={
                    firstLive > 0
                      ? "Property damage, first aid and medical aid are not options on " +
                        "the report form, so they read zero from " +
                        `${MONTH_LABELS[firstLive]} onward regardless of what occurs.`
                      : null
                  }
                />
                <GshMetricBlock
                  narrow
                  title="Hazard Classification"
                  subtitle="hazards & close calls"
                  matrix={matrices.klass}
                  currentMonth={currentMonth}
                  firstLive={firstLive}
                  note={siteNote}
                />
                <GshMetricBlock
                  narrow
                  title="Hazard Type"
                  subtitle="tracking type"
                  matrix={matrices.track}
                  currentMonth={currentMonth}
                  firstLive={firstLive}
                  note={siteNote}
                />
                <GshMetricBlock
                  narrow
                  title="Contributing Factors"
                  subtitle={`${matrices.factor.grandTotal} recorded YTD`}
                  matrix={matrices.factor}
                  currentMonth={currentMonth}
                  firstLive={firstLive}
                  note={siteNote}
                />
              </div>

              <p
                style={{
                  margin: "24px 0 11px",
                  color: "#13DCE5",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Trend analysis
              </p>
              <GshTrendAnalysis
                eventMatrix={matrices.event}
                classMatrix={matrices.klass}
                factorMatrix={matrices.factor}
                currentMonth={currentMonth}
                narrow
              />

              <div
                style={{
                  color: "#9AA5AA",
                  fontSize: 10.5,
                  opacity: 0.55,
                  textAlign: "center",
                  lineHeight: 1.6,
                  marginTop: 18,
                }}
              >
                Swipe a table sideways to see all twelve months.
                <br />
                Highlighted column = current period. Amber = twelve-month peak.
                <br />
                Classification, hazard type and contributing factors allow several
                selections per report, so totals exceed the report count.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Headline figure with its arithmetic shown. The monthly report prints a
   total that has to be trusted; here the components are listed so the number
   can be checked at a glance. */
function SummaryCard({ matrix, currentMonth }) {
  const total = matrix.totals[currentMonth] || 0;
  const prev = currentMonth > 0 ? matrix.totals[currentMonth - 1] || 0 : 0;
  const delta = prev ? Math.round(((total - prev) / prev) * 100) : null;

  const byCode = Object.fromEntries(
    matrix.rows.map((r) => [r.code, r.values[currentMonth] || 0])
  );
  const gsh = GSH_CODES.reduce((a, c) => a + (byCode[c] || 0), 0);
  const extras = matrix.rows.filter(
    (r) => !GSH_CODES.includes(r.code) && (r.values[currentMonth] || 0) > 0
  );

  return (
    <div
      style={{
        background: "rgba(2,18,23,0.88)",
        border: "1px solid rgba(20,220,229,0.22)",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ color: "#13DCE5", fontSize: 12.5, fontWeight: 700 }}>
        Total GSH Reports
      </div>
      <div
        style={{
          color: "#13DCE5",
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          margin: "6px 0 8px",
        }}
      >
        {total}
      </div>
      <div style={{ color: "#9AA5AA", fontSize: 12.5, lineHeight: 1.5 }}>
        {byCode.ofi || 0} OFI, {byCode.good_spot || 0} Good Spots and{" "}
        {byCode.hazard_report || 0} Hazards in {MONTH_LABELS[currentMonth]}.
        {delta !== null && (
          <span
            style={{
              display: "inline-block",
              marginLeft: 6,
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              background: delta < 0 ? "rgba(224,168,15,0.14)" : "rgba(20,220,229,0.14)",
              color: delta < 0 ? "#E0A80F" : "#13DCE5",
            }}
          >
            {delta < 0 ? "▼" : "▲"} {Math.abs(delta)}% vs {MONTH_LABELS[currentMonth - 1]}
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ color: "#13DCE5", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
          Reconciliation
        </div>
        <Row label="OFI + Good Spot + Hazards" value={gsh} />
        {extras.map((r) => (
          <Row key={r.code} label={`+ ${r.label.toLowerCase()}`} value={r.values[currentMonth]} />
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            paddingTop: 8,
            borderTop: "1px solid rgba(20,220,229,0.18)",
            fontSize: 13,
          }}
        >
          <b style={{ color: "#F5F7F7" }}>Total events</b>
          <b style={{ color: "#13DCE5" }}>{total}</b>
        </div>
        <div style={{ color: "#9AA5AA", fontSize: 10.5, opacity: 0.6, marginTop: 8 }}>
          Computed from records — never typed.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: 12.5,
        color: "#D5D8DC",
      }}
    >
      <span>{label}</span>
      <span style={{ color: "#13DCE5", fontWeight: 700 }}>{value}</span>
    </div>
  );
}
