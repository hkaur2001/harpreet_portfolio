import http from "node:http";

const counters = new Map();

function kindFor(path, body) {
  if (String(body?.instructions || "").includes("Atlas Financial Research Desk")) return "atlas-desk";
  if (String(body?.instructions || "").includes("You are Atlas")) return "atlas";
  if (path.endsWith("/embeddings")) return "embeddings";
  const input = String(body?.input ?? "");
  if (input.includes("Analyze the recurring writing style")) return "voice-generate";
  if (input.includes("Grade the generated content")) return "voice-judge";
  if (input.includes("Act as a research agent")) return "research";
  if (input.includes("Evaluate a research digest")) return "research-judge";
  if (input.includes("You answer only from the supplied authorized sources")) return "knowledge-answer";
  if (input.includes("Revise the draft once")) return "voice-revision";
  if (input.includes("enterprise AI deployment strategist")) return "fieldguide-strategy";
  return "responses";
}

function shouldRateLimit(kind) {
  const count = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, count);
  return count === 1;
}

function vector(text, dims = 12) {
  const result = Array(dims).fill(0);
  for (let i = 0; i < text.length; i += 1) result[i % dims] += (text.charCodeAt(i) % 31) / 31;
  const norm = Math.sqrt(result.reduce((sum, value) => sum + value * value, 0)) || 1;
  return result.map((value) => value / norm);
}

function responseText(text) {
  return { output: [{ type: "message", content: [{ type: "output_text", text }] }], usage: { input_tokens: 120, output_tokens: 80 } };
}

function researchResponse() {
  return {
    output: [
      {
        type: "web_search_call",
        action: {
          sources: [
            { title: "Agent reliability discussion", url: "https://www.reddit.com/r/MachineLearning/comments/example" },
            { title: "Model evaluation guide", url: "https://openai.com/index/evals-drive-next-chapter-of-ai/" },
            { title: "Engineering newsletter", url: "https://example.substack.com/p/agent-evals" },
          ],
        },
      },
      {
        type: "message",
        content: [{
          type: "output_text",
          text: "Three signals worth knowing\n\n1. Production AI teams are treating evaluation as a release discipline, not a demo metric.\nWhy it matters: be ready to discuss golden sets, failure slices, and regression gates.\nAction: explain one eval you would block a release on.\n\n2. Tool boundaries and observability matter as much as model quality in agent systems.\nWhy it matters: interviews increasingly probe what the model is allowed to do and how failures are traced.\nAction: describe typed tools, approval gates, and traces.\n\n3. Retrieval quality should be measured separately from answer quality.\nWhy it matters: a fluent answer can hide a broken retriever.\nAction: distinguish context relevance from groundedness.\n\nSource coverage note: Reddit, newsletter/blog, and primary technical sources were represented; public LinkedIn coverage was not available in this fixture.",
        }],
      },
    ],
    usage: { input_tokens: 240, output_tokens: 260 },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(404).end();
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch {}
  const kind = kindFor(req.url || "", body);

  if (shouldRateLimit(kind)) {
    res.writeHead(429, { "Content-Type": "application/json", "Retry-After": "0" });
    res.end(JSON.stringify({ error: { type: "rate_limit_error", message: "Synthetic rate limit for resilience testing." } }));
    return;
  }

  let payload;
  if ((req.url || "").endsWith("/embeddings")) {
    const inputs = Array.isArray(body.input) ? body.input : [String(body.input ?? "")];
    payload = { data: inputs.map((text, index) => ({ index, embedding: vector(String(text)) })), usage: { total_tokens: inputs.length * 12 } };
  } else if (kind === "atlas-desk") {
    const request = JSON.parse(body.input[0].content);
    const marker = request.question;
    if (marker.includes("DESK_TEST_BILLING")) {
      res.writeHead(402, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Synthetic provider billing failure" } })); return;
    }
    if (marker.includes("DESK_TEST_OUTAGE")) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Synthetic provider outage" } })); return;
    }
    const observations = body.input.filter(i => i.type === "function_call_output").map(i => JSON.parse(i.output).observation);
    const required = { earnings: ["revenue_growth", "ebitda_margin", "document_conflict"], credit: ["leverage", "leverage_stress", "document_conflict"], reconciliation: ["cash_conversion", "revenue_growth", "document_conflict"] }[request.task];
    const call = (name, args, id) => ({ type: "function_call", name, arguments: JSON.stringify(args), call_id: id });
    if (body.text?.format?.name === "atlas_research_brief") {
      const metrics = observations.filter(i => required.includes(i.id) && typeof i.value === "number");
      const brief = { title: "Aster Data Systems — analyst handoff", summary: "Synthetic evidence reconciled against approved H1 figures. Analyst and reviewer verification required before distribution.", findings: metrics.map(m => ({ metricId: m.id, value: m.value, unit: m.unit, conclusion: `${m.id}: ${m.value} ${m.unit}. Approved financials govern; the preliminary revenue version is superseded.`, sourceIds: m.sourceIds, caveat: m.caveat })), openQuestions: ["Validate contractual TTM adjustments before a covenant decision.", "Identify the accountable reviewer and baseline cycle time."], pilot: { owner: "Research operations lead and financial-data reviewer", scope: "Read-only financial brief for one synthetic issuer; no rating, trade, or external distribution.", launchGates: ["No unauthorized source content", "Required numeric fields match reproducible calculations", "Every released brief reviewed by a named analyst"], successMetrics: ["Baseline versus assisted cycle time including review", "Reviewer correction and rework rate"], nextExperiment: "Replay approved versus superseded source conflicts in shadow mode." }, proposedRule: "Prefer approved current source versions; preserve period and methodology; escalate missing contractual definitions to the reviewer.", revisionSummary: request.reviewerFeedback ? "Reviewer feedback addressed: " + request.reviewerFeedback : "Initial investigation." };
      if (marker.includes("DESK_TEST_BAD_CITATION")) brief.findings[0].sourceIds = ["R01"];
      if (marker.includes("DESK_TEST_BAD_VALUE")) brief.findings[0].value = 666;
      if (marker.includes("DESK_TEST_BAD_UNIT")) brief.findings[0].unit = "invented unit";
      payload = responseText(JSON.stringify(brief));
      if (marker.includes("DESK_TEST_BAD_JSON")) payload = responseText("{invalid");
    } else if (!observations.length && marker.includes("DESK_TEST_EARLY_CALC")) {
      payload = { output: required.map((id, index) => call("calculate_metric", { metric_id: id }, `desk-early-${index}`)) };
    } else if (!observations.length || observations.every(o => o.error === "READ_SOURCES_FIRST") || marker.includes("DESK_TEST_MISSING_POLICY")) {
      const ids = ["F02", "F03", "F04", "F05", "F06"].filter(id => !marker.includes("DESK_TEST_MISSING_POLICY") || id !== "F06");
      const calls = ids.map((id, index) => call("read_source", { source_id: id }, `desk-read-${index}-${observations.length}`));
      if (marker.includes("DESK_TEST_ACCESS_PROBE")) calls.push(call("read_source", { source_id: "R01" }, "desk-denied"));
      if (marker.includes("DESK_TEST_UNAUTHORIZED_TOOL")) calls.push(call("send_report", { destination: "https://example.invalid" }, "desk-unsafe"));
      payload = { output: calls, usage: { input_tokens: 90, output_tokens: 60 } };
    } else payload = { output: required.map((id, index) => call("calculate_metric", { metric_id: id }, `desk-metric-${index}`)), usage: { input_tokens: 110, output_tokens: 65 } };
    if (marker.includes("DESK_TEST_NO_TOOLS") && !body.text?.format) payload = responseText("No tools requested.");
  } else if (kind === "atlas") {
    const briefText = JSON.stringify(body.input || []);
    if (briefText.includes("ATLAS_TEST_PROVIDER_FAILURE")) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Synthetic provider outage" } }));
      return;
    }
    const observed = (body.input || []).filter(i => i.type === "function_call_output");
    const call = (name, index, id) => ({ type: "function_call", name, arguments: JSON.stringify({ workflow_index: index }), call_id: id });
    if (body.text?.format?.name === "atlas_deployment_plan") {
      payload = responseText(JSON.stringify({ goal: "Return analyst time without automating investment judgment", recommendedWorkflowIndex: 0, rationale: "Start with evidence synthesis: it is a reversible read-only pilot with a named reviewer and inspectable sources.", assumptions: ["Scenario estimates are synthetic and require customer validation."], discoveryQuestions: ["What are current cycle time and rework rates?", "Who owns source-level permissions?"], phases: [{ dayRange: "Days 1–30", objective: "Baseline and secure evidence", actions: ["Measure cycle time", "Build a representative golden set"], owner: "Business owner + security" }, { dayRange: "Days 31–60", objective: "Learn in shadow mode", actions: ["Review every output", "Replay failure slices"], owner: "Operator lead" }, { dayRange: "Days 61–90", objective: "Launch assisted cohort", actions: ["Keep consequential actions human-approved", "Measure operator acceptance"], owner: "Executive sponsor" }], launchGates: ["Zero permission violations", "Grounded claims at least 96%"], risks: ["Source contradictions and stale permissions"], metrics: ["Cycle time", "Rework", "Operator acceptance"], evidenceIds: ["atlas-e1", "atlas-e2", "atlas-e3", "atlas-e4"] }));
    } else if (observed.length === 0) payload = { output: [call("inspect_workflow", 0, "atlas-call-1"), call("inspect_workflow", 1, "atlas-call-2")], usage: { input_tokens: 80, output_tokens: 60 } };
    else if (observed.length === 2) payload = { output: [call("inspect_controls", 0, "atlas-call-3"), call("assess_capacity", 0, "atlas-call-4")], usage: { input_tokens: 100, output_tokens: 60 } };
    else payload = responseText("Evidence gathering is complete.");
    if (body.text?.format?.name === "atlas_deployment_plan" && briefText.includes("ATLAS_TEST_INVALID_EVIDENCE")) {
      const plan = JSON.parse(payload.output[0].content[0].text);
      plan.evidenceIds = ["invented-evidence"];
      payload = responseText(JSON.stringify(plan));
    }
  } else if (kind === "voice-generate") {
    payload = responseText(JSON.stringify({
      styleProfile: "Direct, reflective, first-person writing with short paragraphs, a concrete lesson, restrained punctuation, and a forward-looking close.",
      draft: "One year in, the biggest lesson is that progress rarely looks like one dramatic breakthrough.\n\nIt looks more like learning the system, asking better questions, shipping something useful, and then realizing how much more there is to improve.\n\nI am grateful for the people who made the year challenging in the right ways. The work changed how I think about building, ownership, and what production quality actually requires.\n\nOnward.",
    }));
  } else if (kind === "voice-judge") {
    payload = responseText(JSON.stringify({ styleFidelity: 4, briefAdherence: 5, platformFit: 4, originality: 5, copyRisk: "low", notes: "Matches the recurring structure without reusing distinctive phrases." }));
  } else if (kind === "voice-revision") {
    payload = responseText("One year in, I am less interested in milestones than in what changed because of the work.\n\nI learned to ask better questions, make failure visible, and treat production quality as part of the product rather than cleanup after launch.\n\nGrateful for the people who pushed the work forward. Onward.");
  } else if (kind === "research") {
    payload = researchResponse();
  } else if (kind === "research-judge") {
    payload = responseText(JSON.stringify({ relevance: 5, synthesis: 4, actionability: 5, sourceDiversity: 4, citationCoverage: 4, notes: "The brief is focused on the stated goal and converts signals into concrete preparation actions." }));
  } else if (kind === "knowledge-answer") {
    payload = responseText("Pricing exceptions require Revenue Enablement review and must follow approved escalation rules [pricing-playbook].");
  } else {
    payload = responseText("ok");
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
});

server.listen(8787, "127.0.0.1", () => console.log("mock OpenAI provider listening on 8787"));
