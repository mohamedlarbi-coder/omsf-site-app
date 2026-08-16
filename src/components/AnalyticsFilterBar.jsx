import React, { useMemo, useState } from "react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { REPORT_TYPES, SITE_OPTIONS } from "../lib/constants";

/* ---------------------------------------------------------------------------
   Filter bar for Site Statistics.

   Presentational only — holds no analytics logic. It reports a filter object
   upward; filterReports() in lib/analytics.js does the actual work, so the
   same filtered dataset feeds every chart and KPI.

   Location options are DERIVED from the records rather than read from
   BUILDING_OPTIONS_BY_SITE, because SUSS has no fixed building list and its
   locations arrive as free text. Deriving also means a location that no
   report actually uses never appears as a dead filter option.

   No PROJECT filter: PROJECT_OPTIONS currently holds a single value, so the
   control would do nothing. Add it back when a second project exists.
--------------------------------------------------------------------------- */

export const PERIOD_OPTIONS = [
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "3-months", label: "Last 3 months" },
  { value: "ytd", label: "Year to date" },
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

export const DEFAULT_FILTERS = {
  period: "month",
  site: "all",
  location: "all",
  reportType: "all",
};

export function countActiveFilters(filters) {
  let n = 0;
  if (filters.site && filters.site !== "all") n += 1;
  if (filters.location && filters.location !== "all") n += 1;
  if (filters.reportType && filters.reportType !== "all") n += 1;
  return n;
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        minHeight: 44,
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        border: active ? "1px solid rgba(20,220,229,0.55)" : "1px solid rgba(20,220,229,0.18)",
        background: active ? "rgba(19,220,229,0.14)" : "rgba(2,18,23,0.7)",
        color: active ? "#20F1EF" : "#9AA5AA",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {active && <Check size={13} strokeWidth={3} />}
      {label}
    </button>
  );
}

function Group({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          color: "#9AA5AA",
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}

export default function AnalyticsFilterBar({ reports = [], filters, onChange }) {
  const [open, setOpen] = useState(false);

  /* Locations actually present in the data, narrowed to the chosen site. */
  const locationOptions = useMemo(() => {
    const scoped =
      filters.site && filters.site !== "all"
        ? reports.filter((r) => r.site === filters.site)
        : reports;

    return Array.from(
      new Set(scoped.map((r) => r.location).filter((l) => l && String(l).trim()))
    ).sort((a, b) => a.localeCompare(b));
  }, [reports, filters.site]);

  const activeCount = countActiveFilters(filters);
  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label || "All time";

  function set(key, value) {
    /* Changing site invalidates any location chosen under the old site. */
    if (key === "site") onChange({ ...filters, site: value, location: "all" });
    else onChange({ ...filters, [key]: value });
  }

  return (
    <>
      {/* Collapsed bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {PERIOD_OPTIONS.map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              active={filters.period === p.value}
              onClick={() => set("period", p.value)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Filters"
          style={{
            position: "relative",
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 14,
            background: "rgba(2,18,23,0.85)",
            border: "1px solid rgba(20,220,229,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SlidersHorizontal size={18} color={activeCount ? "#20F1EF" : "#9AA5AA"} />
          {activeCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 9,
                background: "#13DCE5",
                color: "#02090D",
                fontSize: 11,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Bottom sheet */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "82vh",
              overflowY: "auto",
              background: "#04171C",
              borderTop: "1px solid rgba(20,220,229,0.25)",
              borderRadius: "24px 24px 0 0",
              padding: "18px 18px calc(28px + env(safe-area-inset-bottom))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#F5F7F7", fontSize: 17, fontWeight: 700 }}>Filters</h3>
              <button
                type="button"
                onClick={() => onChange({ ...DEFAULT_FILTERS, period: filters.period })}
                style={{
                  marginLeft: "auto",
                  marginRight: 8,
                  background: "none",
                  border: "none",
                  color: "#13DCE5",
                  fontSize: 13.5,
                  fontWeight: 600,
                  padding: "10px 4px",
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(7,51,58,0.5)",
                  border: "1px solid rgba(20,220,229,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} color="#9AA5AA" />
              </button>
            </div>

            <Group title="Site">
              <Chip label="All sites" active={filters.site === "all"} onClick={() => set("site", "all")} />
              {SITE_OPTIONS.map((s) => (
                <Chip key={s} label={s} active={filters.site === s} onClick={() => set("site", s)} />
              ))}
            </Group>

            <Group title="Location">
              <Chip
                label="All locations"
                active={filters.location === "all"}
                onClick={() => set("location", "all")}
              />
              {locationOptions.map((l) => (
                <Chip key={l} label={l} active={filters.location === l} onClick={() => set("location", l)} />
              ))}
              {locationOptions.length === 0 && (
                <span style={{ color: "#9AA5AA", fontSize: 13, opacity: 0.7 }}>
                  No locations in the current data
                </span>
              )}
            </Group>

            <Group title="Report type">
              <Chip
                label="All types"
                active={filters.reportType === "all"}
                onClick={() => set("reportType", "all")}
              />
              {REPORT_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={filters.reportType === t}
                  onClick={() => set("reportType", t)}
                />
              ))}
            </Group>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                minHeight: 52,
                marginTop: 6,
                borderRadius: 18,
                border: "none",
                background: "linear-gradient(100deg, #20E5E5 0%, #16CBD3 45%, #08798D 100%)",
                color: "#02090D",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              Show results
            </button>

            <div style={{ textAlign: "center", color: "#9AA5AA", fontSize: 11.5, marginTop: 14, opacity: 0.7 }}>
              Period: {periodLabel}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
