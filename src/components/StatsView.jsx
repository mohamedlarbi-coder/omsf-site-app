import React, { useMemo, useState } from "react";
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import BackgroundWatermark from "./BackgroundWatermark";
import AnalyticsFilterBar, { DEFAULT_FILTERS, PERIOD_OPTIONS } from "./AnalyticsFilterBar";
import {
  filterReports,
  comparePeriods,
  getObservationsByType,
  getHazardsByTrackingType,
  getHazardsByClassification,
  getContributingFactors,
  getRiskDistribution,
  getEngagementByAuthor,
  UNAVAILABLE_METRICS,
} from "../lib/analytics";

/* ---------------------------------------------------------------------------
   SITE STATISTICS

   Every number here is computed from real report records. One filtered
   dataset feeds every card and chart, so totals stay consistent across the
   page.

   Percentages always show their denominator. hazard_classes, tracking_types
   and contributing_factors are multi-select, so their denominator is total
   SELECTIONS, not report count — one report can contribute several.

   Metrics requiring data the app does not capture (TRIFR, incident rate,
   man-hours, action closure) render as unavailable rather than as a number.
--------------------------------------------------------------------------- */

const TYPE_COLORS = {
  Hazard: "#dc2626",
  "Good Spot": "#16a34a",
  OFI: "#2563eb",
  Closecall: "#ea580c",
};

const RISK_COLORS = {
  "Very High/High": "#dc2626",
  Medium: "#eab308",
  Low: "#eab308",
  "No Risk": "#16a34a",
};

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 12, paddingInline: 2 }}>
      <h2
        style={{
          margin: 0,
          color: "#F5F7F7",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </h2>
      {sub && <div style={{ color: "#9AA5AA", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: "rgba(2,18,23,0.88)",
        border: "1px solid rgba(20,220,229,0.22)",
        borderRadius: 20,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* A KPI with period-over-period comparison. Trend colour is semantic per
   metric: fewer hazards is good, fewer good spots is not. */
function KpiCard({ label, metric, accent }) {
  const { value, changePct, direction, isImprovement } = metric;

  let Arrow = Minus;
  if (direction === "up") Arrow = TrendingUp;
  else if (direction === "down") Arrow = TrendingDown;

  let trendColor = "#9AA5AA";
  if (isImprovement === true) trendColor = "#16a34a";
  else if (isImprovement === false) trendColor = "#e0a80f";

  return (
    <div
      style={{
        background: "rgba(2,18,23,0.88)",
        border: "1px solid rgba(20,220,229,0.2)",
        borderRadius: 18,
        padding: "14px 14px 12px",
        minHeight: 104,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ color: "#9AA5AA", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: accent || "#F5F7F7", fontWeight: 800, fontSize: 28, lineHeight: 1.1, marginTop: 8 }}>
        {value}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
        <Arrow size={13} color={trendColor} strokeWidth={2.4} />
        <span style={{ color: trendColor, fontSize: 12, fontWeight: 700 }}>
          {changePct === null ? "—" : `${changePct > 0 ? "+" : ""}${changePct}%`}
        </span>
        <span style={{ color: "#9AA5AA", fontSize: 10.5, opacity: 0.75 }}>vs prev.</span>
      </div>
    </div>
  );
}

function UnavailableCard({ label, reason }) {
  return (
    <div
      style={{
        background: "rgba(2,18,23,0.5)",
        border: "1px dashed rgba(154,165,170,0.28)",
        borderRadius: 18,
        padding: "14px 14px 12px",
        minHeight: 104,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ color: "#9AA5AA", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: "#9AA5AA", fontSize: 13.5, fontWeight: 600, marginTop: 10, opacity: 0.8 }}>
        No data available
      </div>
      <div style={{ color: "#9AA5AA", fontSize: 10.5, opacity: 0.6, marginTop: "auto", paddingTop: 8, lineHeight: 1.35 }}>
        {reason}
      </div>
    </div>
  );
}

/* Ranked horizontal bars. Bar width is relative to the largest value so small
   differences stay readable; the label carries the true count and share. */
function RankedBars({ result, color = "#13DCE5", limit = 10, emptyLabel = "No data for this selection" }) {
  if (!result || result.isEmpty) {
    return <div style={{ color: "#9AA5AA", fontSize: 13, opacity: 0.75 }}>{emptyLabel}</div>;
  }

  const items = result.items.slice(0, limit);
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div>
      {items.map((item) => (
        <div key={item.label} style={{ marginBottom: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ color: "#F5F7F7", fontSize: 13.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
            <span style={{ color: "#9AA5AA", fontSize: 12.5, flexShrink: 0 }}>
              <strong style={{ color: "#13DCE5" }}>{item.count}</strong> · {item.pct}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(7,51,58,0.6)", overflow: "hidden" }}>
            <div
              style={{
                width: `${(item.count / max) * 100}%`,
                height: "100%",
                borderRadius: 3,
                background: typeof color === "function" ? color(item.label) : color,
              }}
            />
          </div>
        </div>
      ))}
      <div style={{ color: "#9AA5AA", fontSize: 10.5, opacity: 0.6, marginTop: 4 }}>
        % of {result.denominator} {result.denominatorUnit}
      </div>
    </div>
  );
}

export default function StatsView({ reports = [], profiles = [], setView }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const filtered = useMemo(() => filterReports(reports, filters), [reports, filters]);
  const comparison = useMemo(() => comparePeriods(reports, filters), [reports, filters]);

  const byType = useMemo(() => getObservationsByType(filtered), [filtered]);
  const byTracking = useMemo(() => getHazardsByTrackingType(filtered), [filtered]);
  const byClass = useMemo(() => getHazardsByClassification(filtered), [filtered]);
  const byFactor = useMemo(() => getContributingFactors(filtered), [filtered]);
  const byRisk = useMemo(() => getRiskDistribution(filtered), [filtered]);
  const byAuthor = useMemo(() => getEngagementByAuthor(filtered, profiles), [filtered, profiles]);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label || "All time";

  return (
    <div className="min-h-screen font-sans relative" style={{ background: "#020B0F" }}>
      <BackgroundWatermark />

      <div className="relative z-10 mx-auto" style={{ maxWidth: 520, paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}>
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
              onClick={() => setView("log")}
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
              <h1 style={{ margin: 0, color: "#F5F7F7", fontSize: 17, fontWeight: 700 }}>Site Statistics</h1>
              <div style={{ color: "#9AA5AA", fontSize: 11.5, marginTop: 1 }}>
                Safety performance, risk intelligence and engagement
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: 16 }}>
          <AnalyticsFilterBar reports={reports} filters={filters} onChange={setFilters} />

          {/* Scope line — makes it explicit what every number below covers */}
          <div style={{ color: "#9AA5AA", fontSize: 12, marginBottom: 16, paddingInline: 2 }}>
            {periodLabel}
            {filters.site !== "all" && ` · ${filters.site}`}
            {filters.location !== "all" && ` · ${filters.location}`}
            {filters.reportType !== "all" && ` · ${filters.reportType}`}
            {" · "}
            <strong style={{ color: "#13DCE5" }}>{filtered.length}</strong> reports
          </div>

          {filtered.length === 0 ? (
            <Panel style={{ textAlign: "center", padding: "34px 20px" }}>
              <div style={{ color: "#F5F7F7", fontSize: 15, fontWeight: 600 }}>
                No observations found
              </div>
              <div style={{ color: "#9AA5AA", fontSize: 13, marginTop: 6 }}>
                Nothing matches the selected period and filters.
              </div>
            </Panel>
          ) : (
            <>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 26 }}>
                <KpiCard label="Total reports" metric={comparison.totalReports} accent="#20F1EF" />
                <KpiCard label="Hazards" metric={comparison.byType.Hazard} accent={TYPE_COLORS.Hazard} />
                <KpiCard label="Good Spots" metric={comparison.byType["Good Spot"]} accent={TYPE_COLORS["Good Spot"]} />
                <KpiCard label="OFIs" metric={comparison.byType.OFI} accent={TYPE_COLORS.OFI} />
                <KpiCard label="Close calls" metric={comparison.byType.Closecall} accent={TYPE_COLORS.Closecall} />
                <UnavailableCard label="TRIFR" reason={UNAVAILABLE_METRICS.trifr} />
              </div>

              <div style={{ marginBottom: 26 }}>
                <SectionTitle sub="Share of reports submitted in this period">Observations by type</SectionTitle>
                <Panel>
                  <RankedBars result={byType} color={(l) => TYPE_COLORS[l] || "#13DCE5"} />
                </Panel>
              </div>

              <div style={{ marginBottom: 26 }}>
                <SectionTitle sub="Which conditions recur most often on site">Hazard types</SectionTitle>
                <Panel>
                  <RankedBars result={byTracking} />
                </Panel>
              </div>

              <div style={{ marginBottom: 26 }}>
                <SectionTitle sub="Primary hazard classification">Classification</SectionTitle>
                <Panel>
                  <RankedBars result={byClass} />
                </Panel>
              </div>

              <div style={{ marginBottom: 26 }}>
                <SectionTitle sub="Why unsafe conditions occur, not only what occurred">
                  Contributing factors
                </SectionTitle>
                <Panel>
                  <RankedBars result={byFactor} color="#e0a80f" />
                </Panel>
              </div>

              <div style={{ marginBottom: 26 }}>
                <SectionTitle sub="Severity mix across the selection">Risk distribution</SectionTitle>
                <Panel>
                  <RankedBars result={byRisk} color={(l) => RISK_COLORS[l] || "#9AA5AA"} />
                </Panel>
              </div>

              <div style={{ marginBottom: 26 }}>
                <SectionTitle sub="Who is participating in safety reporting">Engagement</SectionTitle>
                <Panel>
                  <RankedBars result={byAuthor} color="#6b7d85" limit={8} />
                </Panel>
              </div>

              <div style={{ color: "#9AA5AA", fontSize: 10.5, opacity: 0.55, textAlign: "center", lineHeight: 1.6 }}>
                All figures calculated from submitted observations.
                <br />
                Classification, hazard type and contributing factors allow multiple
                selections per report, so their totals exceed the report count.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
