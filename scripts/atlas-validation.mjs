const base = process.env.STRESS_BASE_URL || "http://127.0.0.1:3000";
const valid = { verticalId: "banking", brief: "Our analysts reconcile evidence across deal rooms and research before a VP approves their memo. We need a read-only first pilot with source permissions and a measurable baseline.", riskTolerance: 42, capacity: 6, strictGovernance: true };
let checks = 0;
function assert(ok, label) { if (!ok) throw new Error(label); checks++; }
async function post(data, expected = 200, suffix = crypto.randomUUID()) {
  const response = await fetch(base + "/api/atlas/plan", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "test-" + suffix }, body: typeof data === "string" ? data : JSON.stringify(data), signal: AbortSignal.timeout(65_000) });
  const body = await response.json();
  assert(response.status === expected, `Expected ${expected}, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const page = await fetch(base + "/projects/atlas");
assert(page.status === 200, "Native Atlas route did not render");
assert(page.headers.get("content-security-policy")?.includes("frame-ancestors 'none'"), "Missing anti-framing CSP");
assert(page.headers.get("x-content-type-options") === "nosniff", "Missing MIME protection");
assert(!page.headers.has("x-powered-by"), "Framework fingerprint exposed");
assert(!(await page.text()).match(/chatgpt\.site|ChatGPT|Codex/), "Builder branding in rendered page");

for (const verticalId of ["banking", "hardware", "consulting", "healthcare"]) {
  const result = await post({ ...valid, verticalId });
  assert(result.mode === "live", "Atlas substituted non-agentic output");
  assert(result.trace.some(t => t.tool === "inspect_controls"), "Controls were not inspected");
  assert(result.trace.filter(t => t.tool === "inspect_workflow").length >= 2, "No candidate comparison");
  assert(result.plan.phases.length === 3, "Missing rollout phases");
  assert(result.plan.evidenceIds.every(id => result.trace.some(t => t.evidenceId === id)), "Unsupported citation");
}

await Promise.all(Array.from({ length: 8 }, () => post(valid)));
for (const invalid of [null, [], "{bad-json", { ...valid, verticalId: "__proto__" }, { ...valid, brief: {} }, { ...valid, capacity: 0 }, { ...valid, capacity: 17 }, { ...valid, riskTolerance: -1 }, { ...valid, riskTolerance: 101 }, { ...valid, strictGovernance: "yes" }]) await post(invalid, 400);
await post({ ...valid, brief: "x".repeat(9000) }, 413);
await post({ ...valid, brief: valid.brief + " ATLAS_TEST_INVALID_EVIDENCE" }, 502);
await post({ ...valid, brief: valid.brief + " ATLAS_TEST_PROVIDER_FAILURE" }, 502);
const rateKey = crypto.randomUUID();
for (let i = 0; i < 12; i++) await post(valid, 200, rateKey);
await post(valid, 429, rateKey);
const wrongType = await fetch(base + "/api/atlas/plan", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(valid) });
assert(wrongType.status === 415, "Invalid content type accepted");
console.log(`Atlas validation passed: ${checks} assertions; four industries, eight concurrent agents, type/size limits, evidence rejection, provider outage, headers, branding, rate limit.`);
