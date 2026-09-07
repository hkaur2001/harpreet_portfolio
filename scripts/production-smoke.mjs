const base = process.env.PRODUCTION_BASE_URL || "https://harpreet-portfolio-tau.vercel.app";
const expectedSha = process.env.EXPECTED_DEPLOYMENT_SHA || process.env.GITHUB_SHA || "";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, init = {}, expected = [200], timeoutMs = 70_000) {
  const response = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const text = await response.text();
  if (!expected.includes(response.status)) {
    throw new Error(`${path} returned ${response.status}; expected ${expected.join(", ")}. Body: ${text.slice(0, 500)}`);
  }
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { response, text, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForDeployment() {
  const deadline = Date.now() + 6 * 60_000;
  let last = null;
  while (Date.now() < deadline) {
    try {
      const result = await request("/api/model-stack/health", {}, [200], 20_000);
      last = result.json;
      const revisionMatches = !expectedSha || result.json?.deploymentCommit === expectedSha;
      if (
        result.json?.status === "ok" &&
        revisionMatches &&
        result.json?.openAIConfigured === true &&
        result.json?.huggingFaceConfigured === true &&
        result.json?.localEmbeddings?.remoteEmbeddingApiRequired === false
      ) {
        console.log(`✓ production deployment ready: ${result.json.deploymentCommit || "revision unavailable"}`);
        console.log("✓ OpenAI + HF_TOKEN configured; browser-local Hugging Face embeddings enabled");
        return result.json;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await sleep(8_000);
  }
  throw new Error(`Production deployment did not become ready with the expected model configuration. Last observation: ${JSON.stringify(last)}`);
}

async function testPages() {
  const pages = [
    "/",
    "/projects",
    "/projects/sentinel",
    "/projects/secure-knowledge",
    "/projects/voice-agent",
    "/projects/research-agent",
    "/projects/policy-radar",
    "/projects/enough",
    "/enough",
    "/projects/evaluations",
  ];
  await Promise.all(pages.map(async (path) => {
    const result = await request(path, {}, [200], 25_000);
    assert(result.text.length > 300, `${path} returned an unexpectedly small page.`);
  }));
  console.log(`✓ ${pages.length} public product/project pages rendered`);
}

async function testEnough() {
  const health = await request("/api/enough/health", {}, [200], 20_000);
  assert(health.json?.status === "ok", "Enough health check failed.");
  assert(String(health.json?.privacyModel || "").includes("blind quorum"), "Enough privacy contract is missing.");
  console.log(`✓ Enough product health; deploymentMode=${health.json.deploymentMode}; persistence=${Boolean(health.json.persistentStoreConfigured)}; email=${Boolean(health.json.emailNotificationsConfigured)}`);

  if (!health.json?.persistentStoreConfigured) {
    console.log("  ↳ Enough is currently serving its single-browser demo fallback; multi-device lifecycle smoke will activate after Supabase is connected.");
    return;
  }

  const now = Date.now();
  const create = await request("/api/enough/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Production smoke — quorum test",
      emoji: "🧪",
      description: "Ephemeral CI plan used to validate privacy and threshold behavior.",
      location: "Test location",
      startsAt: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
      deadlineAt: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      threshold: 3,
      hostName: "CI Host",
      hostPledged: true,
    }),
  }, [201], 30_000);
  const slug = create.json?.slug;
  assert(slug && create.json?.hostSecret, "Enough create response is incomplete.");
  assert(create.json?.view?.yesCount === 1, "Enough host pledge was not counted exactly once.");
  assert(create.json?.view?.guestList === null, "Enough leaked the guest list before quorum.");

  const aToken = `ci-a-${crypto.randomUUID()}`;
  const friendA = await request(`/api/enough/plans/${slug}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "CI Friend A", response: "yes", participantToken: aToken }),
  }, [200], 30_000);
  assert(friendA.json?.view?.yesCount === 2 && friendA.json?.view?.guestList === null && friendA.json?.view?.status === "open", "Enough revealed identities or confirmed before quorum.");

  const bToken = `ci-b-${crypto.randomUUID()}`;
  const friendB = await request(`/api/enough/plans/${slug}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "CI Friend B", response: "yes", participantToken: bToken }),
  }, [200], 30_000);
  assert(friendB.json?.justConfirmed === true, "Enough did not report the quorum transition.");
  assert(friendB.json?.view?.status === "confirmed", "Enough did not confirm at quorum.");
  assert(Array.isArray(friendB.json?.view?.guestList) && friendB.json.view.guestList.length === 3, "Enough did not reveal the confirmed guest list.");

  const calendar = await request(`/api/enough/plans/${slug}/calendar`, {}, [200], 20_000);
  assert(calendar.text.includes("BEGIN:VCALENDAR") && calendar.text.includes("Production smoke"), "Enough calendar export failed.");
  console.log("✓ Enough create → blind RSVP → atomic quorum → reveal → calendar production lifecycle");
}

async function testVoiceprint() {
  const samples = [
    "I keep seeing teams reach for more AI before they have made the workflow observable. The model is rarely the only thing that needs debugging.",
    "A good automation should make the boring path boring. The interesting engineering is in the exceptions: permissions, retries, ownership, and recovery.",
    "The best product demos answer one question quickly: what changed for the user after this existed? Architecture matters, but the outcome should still be obvious.",
  ].join("\n---\n");

  const result = await request("/api/voice-agent/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      samples,
      brief: "Write a LinkedIn post about why AI evaluation should be designed before launch.",
      format: "LinkedIn post",
      retrieval: {
        model: "Xenova/bge-small-en-v1.5",
        engine: "Hugging Face Transformers.js · browser-local embeddings",
        ranked: [
          { index: 0, score: 0.91 },
          { index: 2, score: 0.84 },
          { index: 1, score: 0.79 },
        ],
      },
    }),
  }, [200], 120_000);

  assert(result.json?.draft?.length > 40, "Voiceprint returned no usable draft.");
  assert(result.json?.styleProfile?.length > 20, "Voiceprint returned no usable style profile.");
  assert(Array.isArray(result.json?.retrieved) && result.json.retrieved.length >= 3, "Voiceprint retrieval contract failed.");
  assert(String(result.json?.metrics?.retrieval || "").includes("Hugging Face"), `Voiceprint did not preserve the local HF retrieval path: ${result.json?.metrics?.retrieval}`);
  assert(result.json?.evaluation, "Voiceprint returned no evaluation result.");
  console.log(`✓ Voiceprint returned a usable draft; generation=${result.json.metrics.model}; retrieval=${result.json.metrics.retrieval}; judge=${result.json.metrics.judge}; degraded=${Boolean(result.json.metrics.degraded)}`);
  if (result.json?.metrics?.degraded) console.log(`  ↳ graceful fallback: ${(result.json.metrics.degradedReasons || []).join(" | ")}`);
}

async function testKnowledge() {
  const result = await request("/api/knowledge/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "What controls are required for production access and role-specific systems?", persona: "sales" }),
  }, [200], 60_000);
  assert(result.json?.answer?.length > 30, "Secure Knowledge returned no usable answer.");
  assert(Array.isArray(result.json?.trace) && result.json.trace.length >= 4, "Secure Knowledge trace is incomplete.");
  assert(Array.isArray(result.json?.sources) && result.json.sources.length >= 1, "Secure Knowledge returned no evidence sources.");
  assert(result.json?.metrics?.model !== "not called", "Secure Knowledge never reached answer generation.");
  console.log(`✓ Secure Knowledge model=${result.json.metrics.model}; retrieval=${result.json.metrics.retrievalMode}; degraded=${Boolean(result.json.metrics.degraded)}`);
}

async function testResearch() {
  const result = await request("/api/research-agent/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: "Prepare for a senior Applied AI or Forward Deployed Engineer interview with production-agent depth.", topics: "agent evaluation, MCP, RAG reliability, model routing" }),
  }, [200], 120_000);
  assert(result.json?.digest?.length > 200, "SignalBrief returned no usable digest.");
  assert(result.json?.evaluation, "SignalBrief returned no evaluation.");
  assert(Array.isArray(result.json?.coverage), "SignalBrief coverage metadata is missing.");
  console.log(`✓ SignalBrief returned a usable brief; model=${result.json.metrics.model}; judge=${result.json.metrics.judge}; sources=${result.json.metrics.sourceCount}; degraded=${Boolean(result.json.metrics.degraded)}`);
}

async function testSentinel() {
  const health = await request("/api/sentinel/health", {}, [200], 20_000);
  assert(health.json?.status === "ok", "Sentinel health check failed.");
  const investigation = await request("/api/sentinel/investigate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId: "bad_deployment", mode: "deterministic" }),
  }, [200], 40_000);
  assert(investigation.json?.diagnosis, "Sentinel returned no diagnosis.");
  assert(Array.isArray(investigation.json?.trace) && investigation.json.trace.length > 0, "Sentinel trace is missing.");
  assert(investigation.json?.policy, "Sentinel policy result is missing.");
  console.log("✓ Sentinel health + investigation contract");
}

async function testAgentLabs() {
  const fixtures = [
    { slug: "context-ops", scenario: "What changed in the onboarding policy and who approves access now?" },
    { slug: "solution-architect", scenario: "A 1,500-person support team wants an AI agent but has not measured ROI inputs yet." },
    { slug: "incident-commander", scenario: "RAG answer quality dropped after a content sync; investigate before changing the prompt." },
  ];
  for (const fixture of fixtures) {
    const result = await request("/api/labs/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fixture) }, [200], 30_000);
    assert(result.json?.headline?.length > 10, `${fixture.slug} returned no headline.`);
    assert(result.json?.summary?.length > 20, `${fixture.slug} returned no summary.`);
    assert(Array.isArray(result.json?.trace) && result.json.trace.length >= 3, `${fixture.slug} returned an incomplete tool trace.`);
    assert(Array.isArray(result.json?.skills) && result.json.skills.length >= 3, `${fixture.slug} returned incomplete skill metadata.`);
    console.log(`✓ server lab ${fixture.slug}: ${result.json.mode}`);
  }
}

async function main() {
  console.log(`Production smoke target: ${base}`);
  await waitForDeployment();
  await testPages();
  await testEnough();
  await testVoiceprint();
  await testKnowledge();
  await testResearch();
  await testSentinel();
  await testAgentLabs();
  console.log("\n✓ Production validation passed: deployed revision, Enough, provider configuration, graceful fallbacks, Sentinel, server agent labs, and all public project pages.");
}

main().catch((error) => {
  console.error("\nProduction validation failed:", error);
  process.exit(1);
});
