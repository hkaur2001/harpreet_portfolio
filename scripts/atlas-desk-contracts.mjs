import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.STRESS_BASE_URL || "http://127.0.0.1:3000";
let checks = 0;
const valid = { task: "earnings", question: "Explain the approved financial results and reconcile source versions.", reviewerFeedback: "", approvedRules: [] };
async function post(body, status = 200, options = {}) {
  const response = await fetch(`${base}/api/atlas/research`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `desk-contract-${randomUUID()}`, ...options.headers }, body: typeof body === "string" ? body : JSON.stringify(body), signal: AbortSignal.timeout(65000) });
  assert.equal(response.status, status, await response.clone().text()); checks++;
  const result = await response.json();
  if (status !== 200) { assert(!result.brief); checks++; }
  return result;
}
for (const task of ["earnings", "credit", "reconciliation"]) {
  const result = await post({ ...valid, task });
  assert.equal(result.mode, "live"); assert.equal(result.telemetry.modelCalls, 3);
  assert.equal(result.calculations.length, 3); assert(result.checks.every(c => c.passed));
  assert(["F02", "F04", "F06"].every(id => result.sources.some(s => s.id === id)));
  for (const finding of result.brief.findings) { const metric = result.calculations.find(c => c.id === finding.metricId); assert.equal(finding.value, metric.value); assert.equal(finding.unit, metric.unit); assert(metric.sourceIds.every(id => finding.sourceIds.includes(id))); checks += 3; }
  checks += 5;
}
for (const changes of [{ task: "__proto__" }, { task: "unknown" }, { question: {} }, { question: "x" }, { question: "x".repeat(2001) }, { reviewerFeedback: null }, { reviewerFeedback: "x".repeat(2001) }, { approvedRules: {} }, { approvedRules: [null] }, { approvedRules: Array(7).fill("rule") }, { approvedRules: ["x".repeat(1001)] }]) await post({ ...valid, ...changes }, 400);
for (const body of [null, [], "{broken"]) await post(body, 400);
await post(valid, 415, { headers: { "content-type": "text/plain" } });
await post("x".repeat(16001), 413);
for (const marker of ["BAD_VALUE", "BAD_UNIT", "BAD_JSON", "BAD_CITATION", "UNAUTHORIZED_TOOL", "MISSING_POLICY", "NO_TOOLS", "OUTAGE"]) await post({ ...valid, question: `DESK_TEST_${marker} inspect the synthetic financial evidence.` }, 502);
const billing = await post({ ...valid, question: "DESK_TEST_BILLING inspect the synthetic financial evidence." }, 502);
assert.equal(billing.code, "PROVIDER_402"); assert.match(billing.error, /billing or quota/i); checks += 2;
const repaired = await post({ ...valid, question: "DESK_TEST_EARLY_CALC inspect synthetic financial data." });
assert(repaired.trace.some(t => t.detail.includes("prerequisites requested"))); assert.equal(repaired.telemetry.modelCalls, 4); checks += 2;
const denied = await post({ ...valid, question: "DESK_TEST_ACCESS_PROBE inspect financial data." });
assert(denied.trace.some(t => t.status === "denied")); assert(!denied.sources.some(s => s.id === "R01")); checks += 2;
const revised = await post({ ...valid, reviewerFeedback: "Emphasize the proxy methodology.", approvedRules: ["Preserve reporting periods."] });
assert(revised.brief.revisionSummary.includes("proxy methodology")); assert.deepEqual(revised.appliedRules, ["Preserve reporting periods."]); checks += 2;
for (const id of ["F01", "F02", "F03", "F04", "F05", "F06", "R01", "__proto__", "constructor"]) {
  const response = await fetch(`${base}/api/atlas/evidence?id=${encodeURIComponent(id)}`);
  assert.equal(response.status, /^F0[1-6]$/.test(id) ? 200 : 404); checks++;
}
const concurrent = await Promise.all(Array.from({ length: 6 }, () => post(valid)));
assert.equal(new Set(concurrent.map(r => r.runId)).size, 6); checks++;
const headers = { "x-forwarded-for": `desk-rate-${randomUUID()}` };
for (let i = 0; i < 8; i++) await post({ ...valid, question: "x" }, 400, { headers });
await post(valid, 429, { headers });
console.log(`Atlas desk: ${checks} API, agent-loop, citation, malformed-input, failure, concurrency, and rate-limit checks passed against a test-only provider.`);
