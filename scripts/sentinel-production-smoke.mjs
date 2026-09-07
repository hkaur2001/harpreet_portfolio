const base = process.env.PRODUCTION_BASE_URL || "https://harpreet-portfolio-tau.vercel.app";

const scenarios = [
  "database_connection_exhaustion",
  "api_latency_spike",
  "bad_deployment",
  "memory_leak",
  "service_down",
  "network_failure",
  "schema_change",
  "authentication_failure",
  "queue_backlog",
  "unknown_failure",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init = {}, expected = [200], timeoutMs = 70_000) {
  const response = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!expected.includes(response.status)) {
    throw new Error(`${path} returned ${response.status}; expected ${expected.join(", ")}. Body: ${text.slice(0, 600)}`);
  }
  return { response, json };
}

async function investigate(scenarioId, mode) {
  const result = await request("/api/sentinel/investigate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId, mode }),
  }, [200], mode === "live" ? 58_000 : 20_000);

  assert(result.json?.scenarioId === scenarioId, `${scenarioId}: response scenario mismatch.`);
  assert(result.json?.diagnosis?.rootCause?.length > 10, `${scenarioId}: diagnosis missing.`);
  assert(Array.isArray(result.json?.trace) && result.json.trace.length >= 3, `${scenarioId}: tool trace incomplete.`);
  assert(Array.isArray(result.json?.evidence), `${scenarioId}: evidence array missing.`);
  assert(result.json?.policy?.allowed === true, `${scenarioId}: expected bounded policy to be allowed.`);
  assert(result.json?.metrics?.toolCalls === result.json.trace.length, `${scenarioId}: tool-call metric does not match trace.`);
  return result.json;
}

async function testEveryDeterministicScenarioAndRecovery() {
  for (const scenarioId of scenarios) {
    const result = await investigate(scenarioId, "deterministic");
    assert(result.mode === "deterministic", `${scenarioId}: deterministic mode did not stay deterministic.`);
    assert(!result.fallbackReason, `${scenarioId}: deterministic request unexpectedly reported a live fallback.`);

    const action = result.diagnosis.remediation.action;
    if (action === "no_action") {
      assert(result.state === "ESCALATED", `${scenarioId}: no_action scenario should escalate.`);
      console.log(`✓ ${scenarioId}: investigation + safe no-action escalation`);
      continue;
    }

    const recovery = await request("/api/sentinel/remediate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, action, approved: true }),
    }, [200], 20_000);

    assert(recovery.json?.status === "recovered", `${scenarioId}: remediation did not recover.`);
    assert(recovery.json?.simulated === true, `${scenarioId}: remediation must remain simulated.`);
    assert(recovery.json?.action === action, `${scenarioId}: remediation action mismatch.`);
    assert(recovery.json?.postmortem?.rootCause?.length > 10, `${scenarioId}: postmortem missing.`);
    assert(recovery.json?.after && Object.keys(recovery.json.after).length > 0, `${scenarioId}: recovery metrics missing.`);
    console.log(`✓ ${scenarioId}: investigation + ${action} + recovery`);
  }
}

async function testLiveBadDeployment() {
  const started = Date.now();
  const result = await investigate("bad_deployment", "live");
  const wallClockMs = Date.now() - started;

  assert(result.liveRequested === true, "Live Sentinel did not record liveRequested=true.");
  assert(result.metrics?.toolCalls >= 3, "Live Sentinel/fallback used fewer than three evidence tools.");
  assert(result.diagnosis?.remediation?.action === "rollback_deployment", `Live bad-deployment scenario recommended ${result.diagnosis?.remediation?.action} instead of rollback_deployment.`);
  assert(wallClockMs < 58_000, `Live Sentinel did not complete within the public interaction bound (${wallClockMs}ms).`);

  if (result.mode === "live") {
    assert(!result.fallbackReason, `Successful live Sentinel unexpectedly reported fallback: ${result.fallbackReason}`);
    assert(result.model && result.model !== "deterministic-safety-fallback", "Live Sentinel did not use an OpenAI model.");
    assert(result.metrics?.modelCalls >= 1, "Live Sentinel made no model calls.");
    console.log(`✓ live bad_deployment: model=${result.model}; modelCalls=${result.metrics.modelCalls}; tools=${result.metrics.toolCalls}; latency=${result.metrics.latencyMs}ms`);
    return;
  }

  // Provider capacity is external to the application. When it is unavailable, the
  // public button must still finish visibly with a full evidence trace and an
  // explicit explanation rather than spinning or silently pretending it was live.
  assert(result.mode === "deterministic", `Unexpected live fallback mode: ${result.mode}`);
  assert(typeof result.fallbackReason === "string" && result.fallbackReason.length > 20, "Live provider fallback was not explained to the visitor.");
  assert(result.model === "deterministic-safety-fallback", `Fallback model was not explicit: ${result.model}`);
  console.log(`✓ live bad_deployment bounded fallback: tools=${result.metrics.toolCalls}; wallClock=${wallClockMs}ms; reason=${result.fallbackReason}`);
}

async function testValidationAndPolicyEdges() {
  await request("/api/sentinel/investigate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId: "not-a-scenario", mode: "deterministic" }),
  }, [404], 10_000);

  await request("/api/sentinel/remediate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId: "bad_deployment", action: "restart_service", approved: true }),
  }, [409], 10_000);

  await request("/api/sentinel/remediate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId: "bad_deployment", action: "rollback_deployment", approved: false }),
  }, [428], 10_000);

  console.log("✓ validation, wrong-action rejection, and human-approval enforcement");
}

async function main() {
  console.log(`Sentinel production validation target: ${base}`);
  await testEveryDeterministicScenarioAndRecovery();
  await testLiveBadDeployment();
  await testValidationAndPolicyEdges();
  console.log("\n✓ Sentinel production validation passed for all 10 scenarios, every bounded remediation path, live-request completion behavior, validation errors, and approval policy.");
}

main().catch((error) => {
  console.error("\nSentinel production validation failed:", error);
  process.exit(1);
});
