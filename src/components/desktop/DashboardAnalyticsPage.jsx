import React, { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import GshMetricBlock from "./GshMetricBlock";
import GshTrendAnalysis from "./GshTrendAnalysis";
import {
  DOMAINS,
  MONTH_LABELS,
  buildYearMatrix,
  fetchMetrics,
  fetchRollup,
  fetchRollupMonths,
  firstLiveMonth,
  lastReportedMonth,
} from "../../lib/gshRollup";

/* MINERVIUM — Analytics: the RSSOM Key Metric Dashboard.

   The twelve-month grids from the monthly GSH report, generated rather than
   transcribed, each with its rows drawn as a trend line beneath.

   Desktop only by design — a Jan–Dec grid is an office tool. StatsView stays
   the mobile view for the field.

   Two sources, one series: Jan–Jul 2026 comes from gsh_monthly_rollup (totals
   lifted from the GSH Summary Report — no individual records exist for those
   months), later months are counted from live reports. A month is read from
   exactly one source, so the two can never double-count. */

const SITES = ["RSSOM", "OMSF", "SUSS"];

const COMBINED_ONLY_NOTE =
  "Before app capture this table exists only at project level in the source " +
  "report, so the site filter does not apply to those months.";

export default function DashboardAnalyticsPage({ profile, reports = [], setView, showToast }) {
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
  const siteNote = site !== "RSSOM" ? COMBINED_ONLY_NOTE : null;

  function comingSoon(feature) {
    showToast?.(`${feature} isn't built yet — coming soon`);
  }

  function handleSidebarNav(key) {
    if (key === "analytics") return;
    if (key === "dashboard") setView("home");
    else if (key === "observations") setView("observations-desktop");
    else if (key === "actions") setView("actions-desktop");
    else if (key === "inspections") setView("inspections-desktop");
    else if (key === "reports") setView("stats");
    else if (key === "settings") setView("settings");
    else comingSoon(key.charAt(0).toUpperCase() + key.slice(1));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08131D", display: "flex", fontFamily: "Inter, -apple-system, sans-serif", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "url('/branding/hero-background.jpg')",
          backgroundSize: "cover", backgroundPosition: "center 30%",
        }}
      />
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(6,16,24,0.90) 0%, rgba(6,16,24,0.96) 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
        <DashboardSidebar active="analytics" onNavigate={handleSidebarNav} profile={profile} />

        <div style={{ flex: 1, padding: "22px 28px 60px", overflowX: "hidden", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>
                RSSOM Key Metric Dashboard
              </div>
              <div style={{ fontSize: 12.5, color: "#8A9198", marginTop: 2 }}>
                Good Spot / Hazard performance
                {currentMonth >= 0 && ` · period ending ${MONTH_LABELS[currentMonth]} ${year}`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {SITES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSite(s)}
                  aria-pressed={site === s}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 10,
                    background: site === s ? "rgba(24,201,203,0.14)" : "#0d1b26",
                    border: `1px solid ${site === s ? "rgba(37,224,222,0.45)" : "rgba(160,190,204,0.14)"}`,
                    color: site === s ? "#25E0DE" : "#D5D8DC",
                    font: "inherit",
                    fontSize: 12.5,
                    fontWeight: site === s ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  {s === "RSSOM" ? "RSSOM combined" : s}
                </button>
              ))}
              <button
                style={{ width: 34, height: 34, borderRadius: 10, background: "#0d1b26", border: "1px solid rgba(160,190,204,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                onClick={() => comingSoon("Notifications")}
              >
                <Bell size={16} color="#D5D8DC" />
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>
          )}
          {!data && !error && (
            <p style={{ color: "#8A9198", fontSize: 13 }}>Loading GSH data…</p>
          )}

          {matrices && currentMonth < 0 && (
            <p style={{ color: "#8A9198", fontSize: 13 }}>No GSH data for {year} yet.</p>
          )}

          {matrices && currentMonth >= 0 && (
            <>
              {firstLive > 0 && (
                <p
                  style={{
                    margin: "0 0 18px",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(224,168,15,0.26)",
                    background: "rgba(224,168,15,0.06)",
                    color: "rgba(255,236,214,0.88)",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                  }}
                >
                  <b style={{ color: "#E0A80F" }}>
                    Capture method changed in {MONTH_LABELS[firstLive]}.
                  </b>{" "}
                  Earlier months come from the monthly GSH report, collected on a desktop
                  form. From {MONTH_LABELS[firstLive]} the figures are counted from reports
                  filed in this app, which crews can reach on site. Expect reported volume
                  to rise on that alone — read a step change at the dashed line as a
                  reporting change until proven otherwise.
                </p>
              )}

              <div style={{ display: "grid", gap: 14 }}>
                <GshMetricBlock
                  title="Event Type"
                  matrix={matrices.event}
                  currentMonth={currentMonth}
                  firstLive={firstLive}
                  note={
                    firstLive > 0
                      ? "Property damage, first aid and medical aid are not options on the " +
                        "report form, so they read zero from " +
                        `${MONTH_LABELS[firstLive]} onward regardless of what occurs on site.`
                      : null
                  }
                />

                <GshMetricBlock
                  title="Hazard Classification"
                  subtitle="hazards & close calls"
                  matrix={matrices.klass}
                  currentMonth={currentMonth}
                  firstLive={firstLive}
                  note={siteNote}
                />

                <GshMetricBlock
                  title="Hazard Type"
                  subtitle="tracking type"
                  matrix={matrices.track}
                  currentMonth={currentMonth}
                  firstLive={firstLive}
                  note={siteNote}
                />

                <GshMetricBlock
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
                  margin: "28px 0 11px",
                  color: "#25E0DE",
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
              />

              <p style={{ marginTop: 20, color: "#5C6870", fontSize: 10.5, lineHeight: 1.6 }}>
                Highlighted column = current reporting period. Amber = twelve-month peak for
                that row. Greyed months are not yet reported. Dashed lines are categories
                with no records this year.
                <br />
                Classification, hazard type and contributing factors allow several
                selections per report, so their totals exceed the report count.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
