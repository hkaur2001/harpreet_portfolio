import assert from "node:assert/strict";
import { calculateDeskMetric, readDeskSource } from "../lib/atlas/desk-evidence.ts";
import { evaluateTimeBudget } from "../lib/atlas/desk-catalog.ts";
let checks = 0;
for (const [id, expected, unit] of [["revenue_growth", 100 / 7, "%"], ["ebitda_margin", 20, "%"], ["leverage", 35 / 12, "x"], ["leverage_stress", 175 / 48, "x"], ["cash_conversion", 62.5, "%"], ["document_conflict", 30, "USD million"]]) {
  const actual = calculateDeskMetric(id);
  assert(Math.abs(actual.value - expected) < 1e-9, id);
  assert.equal(actual.unit, unit);
  assert(actual.sourceIds.every(source => readDeskSource(source))); checks += 3;
}
for (const id of ["R01", "__proto__", "constructor", "", "F07"]) { assert.equal(readDeskSource(id), null); checks++; }
for (let i = 1; i <= 6; i++) { assert(readDeskSource(`F0${i}`).body.startsWith("SYNTHETIC")); checks++; }
assert.equal(readDeskSource("F04").approved, false); checks++;
const source = readDeskSource("F02"); source.body = "tampered";
assert.notEqual(readDeskSource("F02").body, "tampered"); checks++;
assert.equal(evaluateTimeBudget(45, 15, 8, 20).hoursPerWeek, 22 / 3); checks++;
assert.equal(evaluateTimeBudget(5, 15, 8, 20).hoursPerWeek, -6); checks++;
assert.equal(evaluateTimeBudget(0, 0, 0, 0).hoursPerWeek, 0); checks++;
for (const values of [[NaN, 0, 0, 1], [Infinity, 0, 0, 1], [-1, 0, 0, 1], [601, 0, 0, 1], [1, 601, 0, 1], [1, 0, 601, 1], [1, 0, 0, 10001], [1, 0, 0, -1]]) { assert.throws(() => evaluateTimeBudget(...values)); checks++; }
console.log(`Atlas desk: ${checks} golden arithmetic, source-boundary, and time-budget checks passed. No claim of measured customer savings.`);
