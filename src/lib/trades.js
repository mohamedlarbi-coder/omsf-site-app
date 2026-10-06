/* Helpers for "by trade" views. A trade is a subcontractor. Every trade in the
   subcontractors list always appears — with 0 when nothing is connected to it. */

export const TRADE_COLORS = ["#12C4C7", "#247FC8", "#E5A01E", "#8C6FE0", "#E5604D", "#4CC38A", "#D4709A", "#6FA8DC"];
export const NO_TRADE = "No trade";

const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

export function tradeOfReport(r) {
  const name = r.subcontractor === "Others" ? r.subcontractor_other : r.subcontractor;
  return norm(name) || NO_TRADE;
}
export const tradeOfAction = (a) => norm(a.subcontractor) || NO_TRADE;

/** Counts per trade. `tradeNames` = the known subcontractor names (shown even at 0).
 *  Unknown names found in the data are appended; "No trade" only shows if used. */
export function countByTrade(tradeNames, rows, getTrade) {
  const counts = new Map();
  tradeNames.forEach((n) => counts.set(norm(n), 0));
  rows.forEach((row) => {
    const t = getTrade(row);
    counts.set(t, (counts.get(t) || 0) + 1);
  });
  if (!counts.get(NO_TRADE)) counts.delete(NO_TRADE);
  const list = [...counts.entries()].map(([name, count]) => ({ name, count }));
  list.sort((a, b) => (a.name === NO_TRADE) - (b.name === NO_TRADE) || b.count - a.count || a.name.localeCompare(b.name));
  return list.map((t, i) => ({ ...t, color: t.name === NO_TRADE ? "#6B7780" : TRADE_COLORS[i % TRADE_COLORS.length] }));
}
