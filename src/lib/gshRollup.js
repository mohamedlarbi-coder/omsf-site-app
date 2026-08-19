/* ---------------------------------------------------------------------------
   MINERVIUM — GSH historical rollup.

   Bridges two data sources into one twelve-month series:

     Jan–Jul 2026   gsh_monthly_rollup, loaded from the GSH Summary Report.
                    Monthly totals only — no individual records exist.
     Aug 2026 on    the reports table, via lib/analytics.js.

   The two halves were NOT collected the same way. Jan–Jul came through a
   desktop Word form on SharePoint; subcontractors filed 3 of 114 reports in
   July because most had no practical way to submit one. The app removes that
   barrier, so reported volume will probably rise on the channel change alone.
   `firstLiveMonth` is exported so charts can mark where the method changed.

   Nothing here duplicates lib/analytics.js. That file owns live data; this
   one owns history and the join between them.
--------------------------------------------------------------------------- */

import { supabase } from "../supabaseClient";
import { parseReportDate } from "./analytics";

/* --- Label ↔ rollup code -------------------------------------------------
   App labels come from lib/constants.js. Rollup codes come from gsh_metrics.
   Both derive from the same GSH form, so these align 1:1 apart from the three
   event types noted below. */

export const EVENT_CODE_BY_LABEL = {
  OFI: "ofi",
  "Good Spot": "good_spot",
  Hazard: "hazard_report",
  Closecall: "close_call",
};

/* Present in the historical data, NOT capturable by the current form.
   They will read zero for every live month — that is a form limitation,
   not an absence of events. */
export const EVENT_CODES_NOT_IN_FORM = ["property_damage", "first_aid", "medical_aid"];

export const CLASS_CODE_BY_LABEL = {
  Physical: "physical",
  Chemical: "chemical",
  Biological: "biological",
  Ergonomic: "ergonomic",
  Safety: "safety",
  "Life-Saving Rule": "life_saving",
  Legislative: "legislative",
  Environmental: "environmental",
  Psychosocial: "psychosocial",
  Others: "other",
};

export const TRACKING_CODE_BY_LABEL = {
  "Fall hazard": "fall",
  PPE: "ppe",
  Housekeeping: "housekeeping",
  "Access Egress/Control Zone": "access_egress_control",
  "Moving Objects": "moving_objects",
  "Drop Objects": "drop_objects",
  "Mobile Equip": "mobile_equipment",
  "Doc/Policy": "doc_policy",
  Tools: "tools",
  Others: "other",
};

export const FACTOR_CODE_BY_LABEL = {
  Communication: "communication",
  Complacency: "complacency",
  "Lack of Knowledge": "lack_of_knowledge",
  "Lack of Teamwork": "lack_of_teamwork",
  "Time pressure": "time_pressure",
  Distraction: "distraction",
  Fatigue: "fatigue",
  "Lack of Resources": "lack_of_resources",
  "Lack of Assertiveness": "lack_of_assertiveness",
  Others: "other",
};

export const DOMAINS = {
  EVENT: "event_type",
  CLASS: "hazard_class",
  TRACKING: "tracking",
  FACTOR: "factor",
};

/* Which report field feeds each domain, and whether it is multi-select. */
const DOMAIN_SOURCE = {
  [DOMAINS.EVENT]: { field: "report_type", multi: false, map: EVENT_CODE_BY_LABEL },
  [DOMAINS.CLASS]: { field: "hazard_classes", multi: true, map: CLASS_CODE_BY_LABEL },
  [DOMAINS.TRACKING]: { field: "tracking_types", multi: true, map: TRACKING_CODE_BY_LABEL },
  [DOMAINS.FACTOR]: { field: "contributing_factors", multi: true, map: FACTOR_CODE_BY_LABEL },
};

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* --- Fetch ---------------------------------------------------------------- */

/** Historical rollup rows for a year, already joined to labels and colours. */
export async function fetchRollup(year) {
  const { data, error } = await supabase
    .from("v_gsh_series")
    .select("period, site_code, domain, code, label, colour, sort, count")
    .gte("period", `${year}-01-01`)
    .lte("period", `${year}-12-01`);

  if (error) throw error;
  return data ?? [];
}

/** Which months are historical rollup. Everything else is live. */
export async function fetchRollupMonths(year) {
  const { data, error } = await supabase
    .from("v_gsh_period_map")
    .select("month_index, source")
    .eq("year", year);

  if (error) throw error;

  const isRollup = Array(12).fill(false);
  for (const r of data ?? []) {
    if (r.source === "rollup") isRollup[r.month_index - 1] = true;
  }
  return isRollup;
}

/** Metric definitions — the row set and colours for every domain. */
export async function fetchMetrics() {
  const { data, error } = await supabase
    .from("gsh_metrics")
    .select("domain, code, label, colour, sort")
    .order("sort");

  if (error) throw error;
  return data ?? [];
}

/* --- Merge ----------------------------------------------------------------
   Builds a 12-month matrix for one domain: rollup counts for historical
   months, live report counts for the rest. A month is never read from both. */

export function buildYearMatrix({
  domain,
  metrics = [],
  rollupRows = [],
  reports = [],
  isRollupMonth = [],
  site = "RSSOM",
}) {
  const defs = metrics
    .filter((m) => m.domain === domain)
    .sort((a, b) => a.sort - b.sort);

  const rows = defs.map((d) => ({
    code: d.code,
    label: d.label,
    colour: d.colour,
    values: Array(12).fill(0),
  }));
  const byCode = new Map(rows.map((r) => [r.code, r]));

  /* Historical half */
  for (const r of rollupRows) {
    if (r.domain !== domain) continue;
    if (site !== "RSSOM" && r.site_code !== site) continue;

    const mi = Number(String(r.period).slice(5, 7)) - 1;
    if (!isRollupMonth[mi]) continue; // month has gone live; ignore stale rollup

    const target = byCode.get(r.code);
    if (target) target.values[mi] += r.count;
  }

  /* Live half */
  const { field, multi, map } = DOMAIN_SOURCE[domain];

  for (const rep of reports) {
    if (site !== "RSSOM" && rep.site !== site) continue;

    const d = parseReportDate(rep);
    if (!d || d.getFullYear() !== yearOf(rollupRows, reports)) continue;

    const mi = d.getMonth();
    if (isRollupMonth[mi]) continue; // historical month owns this period

    const raw = rep[field];
    const labels = multi ? (Array.isArray(raw) ? raw : []) : raw ? [raw] : [];

    for (const label of labels) {
      const code = map[label] ?? "other";
      const target = byCode.get(code);
      if (target) target.values[mi] += 1;
    }
  }

  for (const r of rows) r.total = r.values.reduce((a, b) => a + b, 0);

  const totals = Array(12).fill(0);
  for (const r of rows) r.values.forEach((v, i) => { totals[i] += v; });

  return { rows, totals, grandTotal: totals.reduce((a, b) => a + b, 0) };
}

/* The year being rendered — taken from the data rather than the clock, so a
   late-filed month does not silently drop out of the matrix. */
function yearOf(rollupRows, reports) {
  if (rollupRows.length) return Number(String(rollupRows[0].period).slice(0, 4));
  for (const r of reports) {
    const d = parseReportDate(r);
    if (d) return d.getFullYear();
  }
  return new Date().getFullYear();
}

/** Last month holding any data. Drives the highlighted column. */
export function lastReportedMonth(totals) {
  for (let i = 11; i >= 0; i--) if (totals[i] > 0) return i;
  return -1;
}

/** First month captured in the app rather than the summary report. */
export function firstLiveMonth(isRollupMonth, totals) {
  for (let i = 0; i < 12; i++) {
    if (!isRollupMonth[i] && totals[i] > 0) return i;
  }
  return -1;
}
