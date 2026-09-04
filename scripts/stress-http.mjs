const base = process.env.STRESS_BASE_URL || "http://127.0.0.1:3000";

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

const voiceSamples = [
  "I keep seeing teams reach for more AI before they have made the workflow observable. The model is rarely the only thing that needs debugging.",
  "A good automation should make the boring path boring. The interesting engineering is in the exceptions: permissions, retries, ownership, and recovery.",
  "The best product demos answer one question quickly: what changed for the user after this existed? Architecture matters, but the outcome should still be obvious.",
].join("\n---\n");

async function request(path, init = {}, expected = [200]) {
  const response = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(20_000) });
  const text = await response.text();
  if (!expected.includes(response.status)) {
    throw new Error(`${path} returned ${response.status}; expected ${expected.join(", ")}. Body: ${text.slice(0, 300)}`);
  }
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { response, text, json };
}

async function concurrent(label, count, fn) {
  const started = Date.now();
  const results = await Promise.all(Array.from({ length: count }, (_, index) => fn(index)));
  const latency = Date.now() - started;
  console.log(`✓ ${label}: ${results.length} requests in ${latency} ms`);
  return results;
}

function assertRetryObserved(label, results) {
  if (!process.env.EXPECT_PROVIDER_RETRIES) return;
  const observed = results.some((result) => Number(result.json?.metrics?.providerRetries ?? 0) > 0);
  if (!observed) throw new Error(`${label} did not demonstrate recovery from an injected provider rate limit.`);
  console.log(`✓ ${label}: injected 429 recovered via retry/backoff`);
}

async function main() {
  const pages = [
    "/",
    "/projects",
    "/projects/sentinel",
    "/projects/secure-knowledge",
    "/projects/voice-agent",
    "/projects/research-agent",
    "/projects/policy-radar",
    "/projects/evaluations",
  ];

  await concurrent("public pages", pages.length * 2, async (i) => {
    const path = pages[i % pages.length];
    const result = await request(path);
    if (!result.text || result.text.length < 200) throw new Error(`${path} rendered an unexpectedly small response.`);
    return result;
  });

  await concurrent("Policy Radar delivery burst", 40, async () => {
    const result = await request("/projects/policy-radar");
    if (!/AI Policy Radar/i.test(result.text) || !/Federal Register/i.test(result.text)) throw new Error("Policy Radar rendered without its expected project contract.");
    return result;
  });

  const health = await request("/api/sentinel/health");
  if (!health.json?.status) throw new Error("Sentinel health payload is incomplete.");
  console.log("✓ Sentinel health contract");

  const knowledgeResults = await concurrent("Secure Knowledge burst", 40, async (i) => {
    const persona = ["employee", "sales", "revenue"][i % 3];
    const result = await request("/api/knowledge/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What are the rules for pricing exceptions and access approval?", persona }),
    });
    if (!result.json?.answer || !Array.isArray(result.json?.trace)) throw new Error("Secure Knowledge response contract failed.");
    return result;
  });
  assertRetryObserved("Secure Knowledge", knowledgeResults);

  const voiceResults = await concurrent("Voiceprint burst", 40, async (i) => {
    const result = await request("/api/voice-agent/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ samples: voiceSamples, brief: `Write a LinkedIn post about designing AI evaluation before launch. Test run ${i}.`, format: "LinkedIn post" }),
    });
    if (!result.json?.draft || !result.json?.styleProfile || !result.json?.evaluation) throw new Error("Voiceprint response contract failed.");
    return result;
  });
  assertRetryObserved("Voiceprint", voiceResults);

  const researchResults = await concurrent("SignalBrief burst", 20, async (i) => {
    const result = await request("/api/research-agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: `I am preparing for Applied AI engineering interviews and want a focused research brief for run ${i}.`, topics: "agent evals, RAG, MCP, reliability" }),
    });
    if (!result.json?.digest || !result.json?.evaluation || !Array.isArray(result.json?.coverage)) throw new Error("SignalBrief response contract failed.");
    return result;
  });
  assertRetryObserved("SignalBrief", researchResults);

  await concurrent("Sentinel all-scenario investigation", scenarios.length * 5, async (i) => {
    const scenarioId = scenarios[i % scenarios.length];
    const result = await request("/api/sentinel/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, mode: "deterministic" }),
    });
    if (!result.json?.diagnosis || !result.json?.policy || !Array.isArray(result.json?.trace)) throw new Error(`Sentinel contract failed for ${scenarioId}.`);
    return result;
  });

  await request("/api/sentinel/remediate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId: "database_connection_exhaustion", action: "rollback_deployment", approved: false }),
  }, [428]);
  const recovered = await request("/api/sentinel/remediate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId: "database_connection_exhaustion", action: "rollback_deployment", approved: true }),
  });
  if (recovered.json?.status !== "recovered" || recovered.json?.simulated !== true) throw new Error("Sentinel recovery contract failed.");
  console.log("✓ Sentinel approval + recovery boundary");

  await request("/api/voice-agent/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ samples: "too short", brief: "short" }) }, [400]);
  await request("/api/research-agent/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: "short", topics: "x" }) }, [400]);
  await request("/api/knowledge/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "x", persona: "employee" }) }, [400]);
  await request("/api/sentinel/investigate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId: "missing", mode: "deterministic" }) }, [404]);
  console.log("✓ validation/error-path contracts");

  console.log("\nStress suite passed: all selected pages, Policy Radar, RAG, Voiceprint, SignalBrief, Sentinel investigation/remediation, validation paths, and injected rate-limit recovery.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
