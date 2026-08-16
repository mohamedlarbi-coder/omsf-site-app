/* ---------------------------------------------------------------------------
   MINERVIUM — Analytics aggregation layer.

   Pure functions only. No React, no UI, no side effects. Every chart and KPI
   in the Site Statistics module reads from here so the same filtered dataset
   feeds every metric.

   SOURCE OF TRUTH: the reports table in Supabase. Nothing in this file
   hardcodes a value from the monthly GSH report.

   DENOMINATORS: hazard_classes, tracking_types and contributing_factors are
   multi-select — one report can hold several values. Percentages for those
   are over TOTAL SELECTIONS, not report count, and every result carries its
   own `denominator` so the UI can label it. Never render a % from here
   without showing what it is a percentage of.
--------------------------------------------------------------------------- */

import {
  REPORT_TYPES,
  HAZARD_CLASSES,
  TRACKING_TYPES,
  CONTRIBUTING_FACTORS,
  PROJECT_OPTIONS,
  SITE_OPTIONS,
} from "./constants";

/* --- Metrics the current data model cannot support -----------------------
   Referenced by KPI cards so they render "No data available" rather than a
   fabricated figure. Each notes what would have to exist first. */
export const UNAVAILABLE_METRICS = {
  hazardRate: "Requires exposure (man-hours) data",
  incidentRate: "Requires incident records",
  trifr: "Requires incident records and man-hours",
  manHours: "Not captured by the application",
  actionClosureRate: "Requires an action status field",
  avgResponseTime: "Requires an actual closure timestamp",
  engagementByRole: "Reporter role is not captured (company is)",
};

/* --- Dates ---------------------------------------------------------------
   report_date is a 'YYYY-MM-DD' string. Parsed component-wise to LOCAL time:
   new Date('2026-07-01') would be UTC midnight = Jun 30 in Toronto, which
   pushes reports into the wrong month at period boundaries. */
export function parseReportDate(report) {
  const raw = report?.report_date || report?.created_at;
  if (!raw) return null;

  const ymd = String(raw).slice(0, 10).split("-");
  if (ymd.length === 3) {
    const [y, m, d] = ymd.map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* Returns { from, to, label } — `to` is exclusive. */
export function resolvePeriod(period, custom = {}, now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  switch (period) {
    case "week": {
      const from = new Date(today);
      from.setDate(from.getDate() - from.getDay());
      return { from, to: tomorrow, label: "This week" };
    }
    case "month":
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: tomorrow,
        label: "This month",
      };
    case "last-month":
      return {
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        to: new Date(today.getFullYear(), today.getMonth(), 1),
        label: "Last month",
      };
    case "3-months":
      return {
        from: new Date(today.getFullYear(), today.getMonth() - 2, 1),
        to: tomorrow,
        label: "Last 3 months",
      };
    case "ytd":
      return { from: new Date(today.getFullYear(), 0, 1), to: tomorrow, label: "Year to date" };
    case "custom": {
      const from = custom.from ? new Date(custom.from) : null;
      const to = custom.to ? new Date(custom.to) : null;
      if (to) to.setDate(to.getDate() + 1); // make end inclusive for the user
      return { from, to, label: "Custom range" };
    }
    default:
      return { from: null, to: null, label: "All time" };
  }
}

/* Same length as the given period, immediately before it — for "vs previous". */
export function previousPeriod(range) {
  if (!range.from || !range.to) return { from: null, to: null };
  const span = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - span), to: new Date(range.from.getTime()) };
}

/* --- Filtering -----------------------------------------------------------
   filters: { project, site, location, reportType, period, customFrom, customTo }
   Any field left empty or set to 'all' is not applied. */
export function filterReports(reports = [], filters = {}) {
  const range = resolvePeriod(
    filters.period,
    { from: filters.customFrom, to: filters.customTo }
  );

  return reports.filter((r) => {
    if (filters.project && filters.project !== "all" && r.project !== filters.project) return false;
    if (filters.site && filters.site !== "all" && r.site !== filters.site) return false;
    if (filters.location && filters.location !== "all" && r.location !== filters.location) return false;
    if (filters.reportType && filters.reportType !== "all" && r.report_type !== filters.reportType) return false;

    if (range.from || range.to) {
      const d = parseReportDate(r);
      if (!d) return false;
      if (range.from && d < range.from) return false;
      if (range.to && d >= range.to) return false;
    }
    return true;
  });
}

/* --- Counting helpers ---------------------------------------------------- */

/* Single-value field. Denominator = number of reports. */
function countBySingle(reports, field, knownValues = []) {
  const counts = new Map();
  knownValues.forEach((v) => counts.set(v, 0));

  let counted = 0;
  reports.forEach((r) => {
    const v = r?.[field];
    if (v === null || v === undefined || v === "") return;
    counts.set(v, (counts.get(v) || 0) + 1);
    counted += 1;
  });

  return toRanked(counts, counted, "reports");
}

/* Multi-select array field. Denominator = total selections across reports,
   which is normally HIGHER than the report count. */
function countByMulti(reports, field, knownValues = []) {
  const counts = new Map();
  knownValues.forEach((v) => counts.set(v, 0));

  let selections = 0;
  reports.forEach((r) => {
    const arr = r?.[field];
    if (!Array.isArray(arr)) return;
    arr.forEach((v) => {
      if (v === null || v === undefined || v === "") return;
      counts.set(v, (counts.get(v) || 0) + 1);
      selections += 1;
    });
  });

  return toRanked(counts, selections, "selections");
}

function toRanked(counts, denominator, denominatorUnit) {
  const items = Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      pct: denominator > 0 ? Math.round((count / denominator) * 1000) / 10 : 0,
    }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return { items, denominator, denominatorUnit, isEmpty: items.length === 0 };
}

/* --- Aggregations -------------------------------------------------------- */

export function getObservationTotals(reports = []) {
  const byType = countBySingle(reports, "report_type", REPORT_TYPES);
  const lookup = {};
  byType.items.forEach((i) => { lookup[i.label] = i.count; });

  return {
    total: reports.length,
    byType: lookup,
    withPhoto: reports.filter((r) => r.photo_data_url).length,
    withCorrectiveAction: reports.filter((r) => (r.corrective_action || "").trim()).length,
  };
}

export function getObservationsByType(reports = []) {
  return countBySingle(reports, "report_type", REPORT_TYPES);
}

export function getHazardsByClassification(reports = []) {
  return countByMulti(reports, "hazard_classes", HAZARD_CLASSES);
}

export function getHazardsByTrackingType(reports = []) {
  return countByMulti(reports, "tracking_types", TRACKING_TYPES);
}

export function getContributingFactors(reports = []) {
  return countByMulti(reports, "contributing_factors", CONTRIBUTING_FACTORS);
}

export function getRiskDistribution(reports = []) {
  return countBySingle(reports, "risk_rating");
}

export function getEngagementByCompany(reports = []) {
  return countBySingle(reports, "company");
}

export function getEngagementByReporter(reports = []) {
  return countBySingle(reports, "respondent");
}

export function getObservationsBySite(reports = []) {
  return countBySingle(reports, "site", SITE_OPTIONS);
}

export function getObservationsByLocation(reports = []) {
  return countBySingle(reports, "location");
}

export function getObservationsByProject(reports = []) {
  return countBySingle(reports, "project", PROJECT_OPTIONS);
}

/* Chronological monthly counts, split by report type. */
export function getMonthlyTrend(reports = [], months = 12, now = new Date()) {
  const buckets = [];
  const index = new Map();

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = {
      key,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      year: d.getFullYear(),
      total: 0,
      byType: {},
    };
    index.set(key, bucket);
    buckets.push(bucket);
  }

  reports.forEach((r) => {
    const d = parseReportDate(r);
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = index.get(key);
    if (!bucket) return;
    bucket.total += 1;
    const t = r.report_type || "Unspecified";
    bucket.byType[t] = (bucket.byType[t] || 0) + 1;
  });

  return buckets;
}

/* --- Period comparison ---------------------------------------------------
   `improvementDirection` is per-metric, not global. Fewer hazards is good.
   Fewer reports submitted is NOT good — it means engagement dropped. */
export function comparePeriods(allReports = [], filters = {}) {
  const range = resolvePeriod(filters.period, { from: filters.customFrom, to: filters.customTo });
  const prevRange = previousPeriod(range);

  const scoped = (r) => {
    if (filters.project && filters.project !== "all" && r.project !== filters.project) return false;
    if (filters.site && filters.site !== "all" && r.site !== filters.site) return false;
    if (filters.location && filters.location !== "all" && r.location !== filters.location) return false;
    return true;
  };

  const inRange = (r, from, to) => {
    if (!from || !to) return false;
    const d = parseReportDate(r);
    return d ? d >= from && d < to : false;
  };

  const base = allReports.filter(scoped);
  const current = base.filter((r) => inRange(r, range.from, range.to));
  const previous = base.filter((r) => inRange(r, prevRange.from, prevRange.to));

  const countType = (list, type) =>
    type ? list.filter((r) => r.report_type === type).length : list.length;

  const build = (type, improvementDirection) => {
    const now = countType(current, type);
    const before = countType(previous, type);
    const hasBaseline = previous.length > 0 || before > 0;
    const changePct = hasBaseline && before > 0
      ? Math.round(((now - before) / before) * 1000) / 10
      : null;

    let direction = "flat";
    if (now > before) direction = "up";
    else if (now < before) direction = "down";

    return {
      value: now,
      previous: before,
      changePct,          // null when there is no baseline — do not render 0%
      direction,
      improvementDirection, // 'down' = a fall is good, 'up' = a rise is good
      isImprovement: direction === "flat" ? null : direction === improvementDirection,
    };
  };

  return {
    range,
    prevRange,
    totalReports: build(null, "up"),       // more reporting = better engagement
    byType: REPORT_TYPES.reduce((acc, t) => {
      // A fall in hazards/close calls is positive; a fall in good spots is not.
      const good = /good/i.test(t);
      acc[t] = build(t, good ? "up" : "down");
      return acc;
    }, {}),
  };
}
