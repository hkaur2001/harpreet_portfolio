export const deskTasks = {
  earnings: { name: "Earnings change brief", audience: "Research & market intelligence", description: "Explain what changed, separate reported from organic growth, and reconcile a superseded revenue number.", requiredMetrics: ["revenue_growth", "ebitda_margin", "document_conflict"] },
  credit: { name: "Credit watch", audience: "Credit & risk teams", description: "Calculate leverage, test a downside case, and surface covenant risk without making a rating or investment decision.", requiredMetrics: ["leverage", "leverage_stress", "document_conflict"] },
  reconciliation: { name: "Financial-data reconciliation", audience: "Data & knowledge operations", description: "Resolve competing source versions, verify cash conversion, and produce an auditable analyst handoff.", requiredMetrics: ["cash_conversion", "revenue_growth", "document_conflict"] },
} as const;
export type DeskTask = keyof typeof deskTasks;
export function evaluateTimeBudget(baseline: number, assisted: number, review: number, volume: number) {
  if ([baseline, assisted, review, volume].some(v => !Number.isFinite(v) || v < 0) || volume > 10000 || [baseline, assisted, review].some(v => v > 600)) throw new Error("Invalid benchmark inputs.");
  return { hoursPerWeek: (baseline - assisted - review) * volume / 60 };
}
export const sourceCatalog = [
  { id: "F01", title: "FY2025 audited financials", date: "2026-02-20", status: "Approved", kind: "Financial statement" },
  { id: "F02", title: "H1 2026 approved financials", date: "2026-08-14", status: "Approved · current", kind: "Financial statement" },
  { id: "F03", title: "H1 earnings-call excerpt", date: "2026-08-14", status: "Management commentary", kind: "Transcript" },
  { id: "F04", title: "Pre-release revenue snapshot", date: "2026-08-10", status: "Superseded draft", kind: "Data extract" },
  { id: "F05", title: "Covenant methodology", date: "2026-08-15", status: "Approved", kind: "Methodology" },
  { id: "F06", title: "Research permissions & release policy", date: "2026-08-15", status: "Mandatory", kind: "Operating procedure" },
] as const;
export const metricLabels: Record<string, string> = { revenue_growth: "Reported revenue growth", ebitda_margin: "Adjusted EBITDA margin", leverage: "Net leverage proxy", leverage_stress: "Downside leverage proxy", cash_conversion: "Operating cash conversion", document_conflict: "Superseded revenue difference" };
