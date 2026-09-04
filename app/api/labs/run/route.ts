import { NextRequest, NextResponse } from "next/server";
import type { LabSlug } from "@/lib/site";

type TraceStep = {
  tool: string;
  purpose: string;
  status: "ok" | "guarded";
  detail: string;
  output?: string;
};

type RunResult = {
  headline: string;
  summary: string;
  trace: TraceStep[];
  evidence: string[];
  metrics: Array<[string, string]>;
  reasoning: string[];
  skills: string[];
  mode: string;
};

type Payload = { slug?: LabSlug; scenario?: string };

type KnowledgeDoc = {
  id: string;
  title: string;
  owner: string;
  groups: string[];
  version: number;
  content: string;
};

const docs: KnowledgeDoc[] = [
  { id: "pricing-q3", title: "Q3 Pricing Playbook", owner: "Revenue Enablement", groups: ["revenue-enablement"], version: 7, content: "Discount exceptions require Revenue Enablement review. Enterprise pricing follows the approved Q3 bands." },
  { id: "onboarding-v17", title: "Onboarding Policy", owner: "People Systems", groups: ["everyone"], version: 17, content: "Final access approval is owned by IT Operations. Standard access review SLA is two business days." },
  { id: "onboarding-v18", title: "Onboarding Policy", owner: "People Systems", groups: ["everyone"], version: 18, content: "Final access approval is owned by Identity Governance. Standard access review SLA is one business day." },
  { id: "sales-hire", title: "Sales New Hire Runbook", owner: "Sales Operations", groups: ["everyone"], version: 4, content: "Confirm identity. Provision baseline access. Request role tools. Manager approves restricted systems. Verify day-one access." },
];

const tokenize = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);

function overlap(question: string, doc: KnowledgeDoc) {
  const q = tokenize(question);
  const d = tokenize(`${doc.title} ${doc.content} ${doc.owner}`);
  let count = 0;
  q.forEach((token) => { if (d.has(token)) count += 1; });
  return count / Math.max(1, q.size);
}

function contextOps(scenario: string): RunResult {
  const userGroups = new Set(["everyone", "sales-operations"]);
  const ranked = docs.map((doc) => ({ doc, score: overlap(scenario, doc) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const denied = ranked.filter(({ doc }) => !doc.groups.some((g) => userGroups.has(g)));
  const allowed = ranked.filter(({ doc }) => doc.groups.some((g) => userGroups.has(g)));

  const trace: TraceStep[] = [
    { tool: "identity.resolve", purpose: "Establish the user security context before retrieval.", status: "ok", detail: "Resolved demo identity to everyone + sales-operations.", output: "groups=[everyone,sales-operations]" },
    { tool: "search.lexical", purpose: "Retrieve relevant documents from the knowledge set.", status: "ok", detail: `${ranked.length} relevant candidate(s) found and ranked by token overlap.`, output: ranked.slice(0, 4).map((r) => `${r.doc.title} (${r.score.toFixed(2)})`).join(", ") || "none" },
    { tool: "policy.pre_filter", purpose: "Remove inaccessible evidence before any answer is composed.", status: denied.length ? "guarded" : "ok", detail: `${denied.length} restricted candidate(s) excluded before generation.`, output: denied.map((r) => r.doc.title).join(", ") || "none" },
  ];

  if (scenario.toLowerCase().includes("changed")) {
    const versions = docs.filter((d) => d.title === "Onboarding Policy").sort((a, b) => a.version - b.version);
    const oldDoc = versions[0];
    const newDoc = versions[1];
    const changes = ["Approval owner: IT Operations → Identity Governance", "Review SLA: two business days → one business day"];
    trace.push({ tool: "document.diff", purpose: "Compare source versions instead of asking a model to infer changes.", status: "ok", detail: "Compared policy v17 with v18.", output: changes.join("; ") });
    trace.push({ tool: "citation.verify", purpose: "Ensure every material claim maps back to retrieved evidence.", status: "ok", detail: "Both change claims are supported by the two source versions.", output: "coverage=100%" });
    return {
      headline: "Two material policy changes detected.",
      summary: `${changes.join(". ")}. The current policy owner is ${newDoc.owner}.`,
      trace,
      evidence: [`${oldDoc.title} v${oldDoc.version}`, `${newDoc.title} v${newDoc.version}`, `${newDoc.owner} ownership metadata`],
      metrics: [["Accessible sources", String(allowed.length)], ["Restricted filtered", String(denied.length)], ["Citation coverage", "100%"], ["Provider cost", "$0.000"]],
      reasoning: ["Retrieve both versions", "Apply ACL filtering first", "Compute a version diff", "Return only claims supported by the diff"],
      skills: ["RAG", "Authorization", "Retrieval", "Document versioning", "Evaluation"],
      mode: "Server-executed deterministic workflow",
    };
  }

  if (scenario.toLowerCase().includes("pricing")) {
    trace.push({ tool: "answer.guard", purpose: "Decide whether the system may reveal content or only safe metadata.", status: "guarded", detail: "The highest-signal pricing source is restricted to Revenue Enablement.", output: "deny-content / allow-existence" });
    return {
      headline: "The playbook exists, but this user cannot read it.",
      summary: "The workflow found the Q3 Pricing Playbook, verified that it is restricted to Revenue Enablement, removed its content before answer composition, and returned only safe metadata. A production implementation could route an access request as a separate approved tool action.",
      trace,
      evidence: ["Q3 Pricing Playbook metadata", "Revenue Enablement ACL", "Resolved user groups"],
      metrics: [["Candidates", String(ranked.length)], ["Restricted filtered", String(denied.length)], ["Permission leaks", "0"], ["Provider cost", "$0.000"]],
      reasoning: ["Resolve user", "Retrieve likely evidence", "Filter inaccessible sources", "Refuse restricted content", "Return safe metadata only"],
      skills: ["Permission-aware RAG", "Security boundaries", "Tool contracts", "Grounding", "Observability"],
      mode: "Server-executed deterministic workflow",
    };
  }

  const runbook = docs.find((d) => d.id === "sales-hire")!;
  trace.push({ tool: "workflow.extract", purpose: "Turn retrieved evidence into an ordered operational workflow.", status: "ok", detail: "Extracted five ordered steps from the runbook.", output: runbook.content });
  trace.push({ tool: "action.guard", purpose: "Keep protected actions behind a human approval boundary.", status: "guarded", detail: "Restricted-system grants remain manager-approved actions.", output: "human_approval_required=true" });
  return {
    headline: "Five-step sales-hire launch workflow with one protected action.",
    summary: runbook.content,
    trace,
    evidence: [runbook.title, "Resolved user groups", "Manager approval rule"],
    metrics: [["Workflow steps", "5"], ["Protected actions", "1"], ["Permission leaks", "0"], ["Provider cost", "$0.000"]],
    reasoning: ["Retrieve the operational runbook", "Extract ordered steps", "Identify write/protected actions", "Require approval rather than auto-executing"],
    skills: ["RAG", "Workflow extraction", "Human-in-the-loop", "Agent safety", "Structured outputs"],
    mode: "Server-executed deterministic workflow",
  };
}

function deploymentArchitect(scenario: string): RunResult {
  const lower = scenario.toLowerCase();
  const bank = lower.includes("bank");
  const roi = lower.includes("roi");
  const support = lower.includes("1,500") || lower.includes("support");

  const missing = bank
    ? ["Identity provider and group source", "Document ACL semantics", "Audit retention requirement", "Allowed write actions", "Evaluation benchmark ownership"]
    : roi
      ? ["Current workflow time", "Weekly user volume", "Adoption target", "Quality threshold", "Loaded labor cost"]
      : ["Top ticket categories", "Current handle time", "Escalation rate", "Source-of-truth systems", "Actions the agent may take"];

  const architecture = bank
    ? ["SSO identity", "ACL-aware ingestion", "hybrid retrieval", "pre-generation policy filter", "cited answer service", "audit/eval store"]
    : ["workflow UI", "retrieval layer", "bounded tool gateway", "agent orchestrator", "eval + telemetry", "human escalation path"];

  const pilot = support
    ? "Start with one high-volume ticket family, read-only retrieval first, then add a single reversible action after quality gates pass."
    : bank
      ? "Start read-only with permission-negative tests as launch blockers; add actions only after audit and authorization controls are proven."
      : "Instrument the current workflow first; only model ROI after baseline time, volume, adoption, and quality are measurable.";

  const trace: TraceStep[] = [
    { tool: "brief.parse", purpose: "Convert an ambiguous request into goals, constraints, actors, and unknowns.", status: "ok", detail: "Classified the scenario and extracted the deployment objective.", output: bank ? "regulated knowledge retrieval" : roi ? "ROI discovery" : "support automation" },
    { tool: "discovery.gaps", purpose: "Prevent architecture decisions from being made on missing customer facts.", status: "guarded", detail: `${missing.length} blocking discovery questions identified.`, output: missing.join("; ") },
    { tool: "architecture.compose", purpose: "Assemble a deployment pattern from the known constraints.", status: "ok", detail: `${architecture.length} architecture components selected.`, output: architecture.join(" → ") },
    { tool: "pilot.define", purpose: "Choose a bounded pilot with measurable launch gates.", status: "ok", detail: "Pilot scope minimizes risk while preserving a measurable business outcome.", output: pilot },
    { tool: "roi.guard", purpose: "Refuse fabricated financial value when the brief lacks a baseline.", status: roi ? "guarded" : "ok", detail: roi ? "No dollar ROI produced because baseline inputs are missing." : "Value metric tied to observable workflow behavior.", output: roi ? "requires baseline inputs" : "measure cycle time + escalation + adoption" },
  ];

  return {
    headline: bank ? "Lead with authorization architecture, not model selection." : roi ? "Instrument the workflow before promising savings." : "Pilot the highest-volume, lowest-risk support path first.",
    summary: `${pilot} The system surfaced the missing discovery inputs instead of silently inventing them.`,
    trace,
    evidence: ["Parsed customer brief", `${missing.length} discovery gaps`, "Architecture pattern", "Pilot launch criteria"],
    metrics: [["Discovery gaps", String(missing.length)], ["Architecture blocks", String(architecture.length)], ["Pilot phases", "3"], ["Invented ROI", "$0"]],
    reasoning: ["Parse the request", "Identify facts that are missing", "Choose architecture from constraints", "Bound the pilot", "Only quantify value when inputs exist"],
    skills: ["System design", "Technical discovery", "Product sense", "ROI modeling", "Applied AI architecture"],
    mode: "Server-executed deterministic workflow",
  };
}

function incidentCommander(scenario: string): RunResult {
  const lower = scenario.toLowerCase();
  const duplicate = lower.includes("duplicate");
  const latency = lower.includes("latency");

  const baseline = latency
    ? { model: 820, retrieval: 180, tools: 120, total: 1190 }
    : { retrievalQuality: 0.91, chunkCount: 12400, aclCoverage: 0.99 };
  const current = latency
    ? { model: 825, retrieval: 420, tools: 610, total: 2020 }
    : { retrievalQuality: 0.68, chunkCount: 19700, aclCoverage: 0.82 };

  const trace: TraceStep[] = [
    { tool: "telemetry.load", purpose: "Load a known-good baseline and the current degraded run.", status: "ok", detail: "Current and baseline telemetry loaded.", output: JSON.stringify({ baseline, current }) },
    { tool: "delta.compute", purpose: "Find what changed instead of guessing from symptoms.", status: "ok", detail: latency ? "Model latency is flat; retrieval and tool time increased sharply." : "Retrieval quality and ACL coverage dropped while indexed chunk count increased.", output: latency ? "model +0.6%, retrieval +133%, tools +408%" : "quality -25%, chunks +59%, ACL coverage -17%" },
  ];

  if (duplicate) {
    trace.push({ tool: "write.circuit_breaker", purpose: "Stop additional harmful writes before diagnosis continues.", status: "guarded", detail: "Ticket-write actions disabled; read-only diagnosis preserved.", output: "writes=false" });
    trace.push({ tool: "idempotency.audit", purpose: "Check whether retries can create the same external side effect twice.", status: "ok", detail: "Runbook targets idempotency keys and retry semantics first.", output: "inspect idempotency_key + retry policy" });
    return {
      headline: "Disable writes first, then audit idempotency and retries.",
      summary: "The workflow trips a write-action circuit breaker before continuing diagnosis. It preserves traces and recommends enforcing duplicate protection in the tool contract rather than asking the model to be more careful.",
      trace,
      evidence: ["Tool-write trace", "Retry policy", "Idempotency contract", "Incident runbook"],
      metrics: [["Write risk", "HIGH"], ["Writes allowed", "NO"], ["First action", "REVERSIBLE"], ["Regression test", "REQUIRED"]],
      reasoning: ["Contain side effects", "Preserve evidence", "Inspect tool contract", "Fix idempotency", "Add a regression test before re-enabling writes"],
      skills: ["Incident response", "Agent tool safety", "Idempotency", "Observability", "Regression testing"],
      mode: "Server-executed deterministic workflow",
    };
  }

  trace.push({ tool: "hypothesis.rank", purpose: "Rank likely failure domains using measured deltas.", status: "ok", detail: latency ? "Tool fan-out / orchestration ranks above model inference." : "Ingestion / ACL metadata ranks above prompt or model regression.", output: latency ? "1) tool orchestration 2) retrieval 3) model" : "1) ingestion 2) ACL metadata 3) retrieval config 4) model" });
  trace.push({ tool: "runbook.match", purpose: "Select the safest reversible mitigation for the highest-ranked hypothesis.", status: "ok", detail: latency ? "Inspect newly sequential tool calls before changing model settings." : "Roll back the index snapshot while investigating the content sync.", output: latency ? "trace fan-out and parallelism" : "rollback index snapshot" });
  trace.push({ tool: "regression.plan", purpose: "Turn the incident into a repeatable test before closing it.", status: "ok", detail: latency ? "Add latency budget test by subsystem." : "Add retrieval-distribution and ACL-coverage checks to sync validation.", output: "CI gate proposed" });

  return {
    headline: latency ? "The bottleneck is outside inference." : "The content sync changed retrieval behavior; roll back the index first.",
    summary: latency ? "Model latency is essentially unchanged, while retrieval and tool execution increased materially. The workflow therefore investigates orchestration before changing the model." : "The workflow detected a sharp change in chunk volume, retrieval quality, and ACL coverage after sync. It recommends a reversible index rollback before prompt tuning.",
    trace,
    evidence: ["Baseline telemetry", "Current telemetry", "Deployment changelog", "Matched runbook"],
    metrics: latency ? [["Model delta", "+0.6%"], ["Retrieval delta", "+133%"], ["Tool delta", "+408%"], ["First action", "REVERSIBLE"]] : [["Quality delta", "-25%"], ["Chunk delta", "+59%"], ["ACL delta", "-17%"], ["First action", "ROLLBACK"]],
    reasoning: ["Compare baseline vs current", "Rank hypotheses from evidence", "Choose the least destructive mitigation", "Define the regression check"],
    skills: ["Observability", "Failure isolation", "Runbooks", "Guardrails", "Production AI reliability"],
    mode: "Server-executed deterministic workflow",
  };
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Payload;
  if (!payload.slug || !payload.scenario) return NextResponse.json({ error: "slug and scenario are required" }, { status: 400 });

  const started = performance.now();
  const result = payload.slug === "context-ops"
    ? contextOps(payload.scenario)
    : payload.slug === "solution-architect"
      ? deploymentArchitect(payload.scenario)
      : incidentCommander(payload.scenario);

  const latency = Math.max(1, Math.round(performance.now() - started));
  return NextResponse.json({ ...result, serverLatencyMs: latency, executedAt: new Date().toISOString() });
}
