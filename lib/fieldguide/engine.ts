import {
  deploymentModes,
  type DeploymentMode,
  type GoldenCase,
  type Opportunity,
  type WorkflowScenario,
} from "@/lib/fieldguide/scenarios";

export type OpportunityScore = Opportunity & {
  score: number;
  tier: "pilot-now" | "next-wave" | "later";
  rationale: string;
};

export type PilotTraceItem = {
  id: string;
  label: string;
  detail: string;
  kind: string;
  system?: string;
  permission: string;
  model?: string;
  checkpoint: number;
  status: "completed" | "approval" | "blocked" | "recovered";
};

export type EvalCaseResult = {
  id: string;
  title: string;
  slice: string;
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function scoreOpportunity(opportunity: Opportunity): OpportunityScore {
  const positive =
    opportunity.value * 0.24 +
    opportunity.frequency * 0.12 +
    opportunity.standardization * 0.14 +
    opportunity.dataReadiness * 0.18 +
    opportunity.reversibility * 0.12 +
    opportunity.sponsorReadiness * 0.2;
  const riskPenalty = (opportunity.risk - 1) * 7;
  const score = Math.round(clamp((positive / 5) * 100 - riskPenalty, 0, 100));
  const tier = score >= 78 && opportunity.risk <= 3 ? "pilot-now" : score >= 60 ? "next-wave" : "later";
  const rationale =
    tier === "pilot-now"
      ? "High business value with strong data readiness, reversibility, and sponsor support."
      : tier === "next-wave"
        ? "Promising, but sequence it after the first workflow proves the controls and operating model."
        : "Keep out of the first deployment because risk or irreversibility is high relative to learning value.";
  return { ...opportunity, score, tier, rationale };
}

export function rankOpportunities(scenario: WorkflowScenario) {
  return scenario.opportunities.map(scoreOpportunity).sort((a, b) => b.score - a.score);
}

export function chooseFirstPilot(scenario: WorkflowScenario) {
  return rankOpportunities(scenario)[0];
}

export function rolloutFor(scenario: WorkflowScenario, mode: DeploymentMode) {
  const first = chooseFirstPilot(scenario);
  return [
    {
      phase: "0–30 days",
      name: "Shadow mode",
      outcome: "Map the real workflow, connect read-only systems, build the golden set, and compare agent recommendations with expert decisions.",
      gates: [
        "Named executive sponsor + operator owner",
        "Read-only connector access approved",
        "Golden set covers happy path, high-risk, conflicting evidence, and prompt-injection slices",
        "No write actions",
      ],
    },
    {
      phase: "31–60 days",
      name: "Assisted production",
      outcome: `Deploy ${first.name.toLowerCase()} to a small operator cohort with human review on every consequential recommendation.`,
      gates: [
        "Policy / approval boundary passes 100% of deterministic tests",
        "Semantic quality clears the expert rubric on the agreed pilot set",
        "Operator override + escalation path is measurable",
        `${deploymentModes[mode].label} data-boundary review signed off`,
      ],
    },
    {
      phase: "61–90 days",
      name: "Bounded automation",
      outcome: "Automate only the reversible, low-risk actions that already demonstrate stable quality; expand cohort before expanding authority.",
      gates: [
        "No unresolved launch-blocking regressions",
        "Time-to-outcome and operator adoption improve against baseline",
        "Write actions remain per-action authorized",
        "Every model / prompt / context change reruns the golden set before promotion",
      ],
    },
  ];
}

function runbookHas(scenario: WorkflowScenario, predicate: (kind: string, permission: string) => boolean) {
  return scenario.runbook.some((step) => predicate(step.kind, step.permission));
}

function evaluateGoldenCase(scenario: WorkflowScenario, item: GoldenCase): EvalCaseResult {
  const hasEvidence = runbookHas(scenario, (kind) => kind === "tool" || kind === "context");
  const hasPolicy = runbookHas(scenario, (kind) => kind === "policy");
  const hasHuman = runbookHas(scenario, (kind) => kind === "human");
  const writeIsSeparated = scenario.runbook.every((step) => step.permission !== "write" || step.kind === "write");
  const checks = [
    {
      name: "Evidence path exists",
      passed: hasEvidence && item.requiredEvidence.length > 0,
      detail: `Required evidence: ${item.requiredEvidence.join(", ")}`,
    },
    {
      name: "Policy boundary exists",
      passed: hasPolicy,
      detail: "Authorization and launch rules are deterministic rather than delegated to the model.",
    },
    {
      name: "Human approval boundary",
      passed: item.requiresApproval ? hasHuman : true,
      detail: item.requiresApproval ? "This slice requires explicit human review." : "No mandatory human gate for this slice.",
    },
    {
      name: "Write authority is isolated",
      passed: writeIsSeparated,
      detail: item.forbiddenAction ? `Forbidden action: ${item.forbiddenAction}` : "No model step has direct write authority.",
    },
  ];
  return {
    id: item.id,
    title: item.title,
    slice: item.slice,
    passed: checks.every((check) => check.passed),
    checks,
  };
}

export function evaluateScenario(scenario: WorkflowScenario) {
  const results = scenario.goldenCases.map((item) => evaluateGoldenCase(scenario, item));
  const total = results.length;
  const passed = results.filter((item) => item.passed).length;
  const approvalCases = scenario.goldenCases.filter((item) => item.requiresApproval).length;
  const injectionCases = scenario.goldenCases.filter((item) => item.slice === "prompt-injection").length;
  return {
    results,
    summary: {
      passed,
      total,
      deterministicPassRate: total ? Math.round((passed / total) * 100) : 0,
      approvalCases,
      injectionCases,
      launchBlocked: passed !== total,
    },
  };
}

export function buildPilotTrace(scenario: WorkflowScenario, injectFailure = false): PilotTraceItem[] {
  const items: PilotTraceItem[] = [];
  let checkpoint = 0;

  scenario.runbook.forEach((step, index) => {
    checkpoint += 1;
    items.push({
      id: step.id,
      label: step.label,
      detail: step.detail,
      kind: step.kind,
      system: step.system,
      permission: step.permission,
      model: step.model,
      checkpoint,
      status: step.kind === "human" ? "approval" : "completed",
    });

    if (injectFailure && index === 2) {
      items.push({
        id: `fault-${step.id}`,
        label: "Injected worker interruption",
        detail: `The run stops after checkpoint ${checkpoint}. Completed tool/model work is not repeated.`,
        kind: "fault",
        permission: "none",
        checkpoint,
        status: "blocked",
      });
      items.push({
        id: `resume-${step.id}`,
        label: "Resume from durable checkpoint",
        detail: `Execution resumes from checkpoint ${checkpoint + 1}; prior steps are replayed from history rather than re-executed.`,
        kind: "recovery",
        permission: "none",
        checkpoint,
        status: "recovered",
      });
    }
  });

  return items;
}

export function modelRoutingPlan(scenario: WorkflowScenario) {
  return scenario.runbook.map((step) => {
    const route =
      step.model === "gpt-5.6-terra"
        ? "Frontier reasoning"
        : step.model === "gpt-5.6-luna"
          ? "Fast model"
          : "Deterministic code";
    return {
      step: step.label,
      route,
      model: step.model ?? "deterministic",
      why:
        route === "Frontier reasoning"
          ? "Use higher-cost reasoning only where ambiguous cross-source judgment justifies it."
          : route === "Fast model"
            ? "Use a lower-latency model for extraction, normalization, and bounded synthesis."
            : "Authentication, policy, state transitions, and write controls should not depend on model judgment.",
    };
  });
}

export function executiveBriefFor(scenario: WorkflowScenario, mode: DeploymentMode) {
  const first = chooseFirstPilot(scenario);
  return {
    executiveSummary: `${scenario.title}: start with ${first.name.toLowerCase()} because it creates visible operator value while keeping high-risk authority outside the model.`,
    hiddenPainPoints: scenario.painPoints.slice(0, 3),
    firstPilot: {
      name: first.name,
      why: first.rationale,
      boundary: "Read broadly enough to assemble evidence; do not allow the model to independently authorize consequential writes.",
    },
    deploymentSequence: rolloutFor(scenario, mode).map((phase) => `${phase.phase}: ${phase.name} — ${phase.outcome}`),
    stakeholderPlan: [
      `Executive sponsor: ${scenario.sponsor} owns business outcome and removes organizational blockers.`,
      `Operator owner: ${scenario.operator} defines the quality bar, edge cases, and escalation path.`,
      "Security / IT validates identity, connector permissions, data boundary, credential brokering, and audit retention.",
      "Engineering owns runbook implementation, instrumentation, regression gates, and incident response.",
    ],
    launchGates: [
      "Policy, approval, and tenant/data-boundary tests must pass with zero bypasses.",
      "Expert-reviewed golden set must cover high-risk and adversarial slices before authority expands.",
      "A rollback / disable path must exist before any write action is enabled.",
      "Measure cycle time, operator acceptance, overrides, quality, cost, and latency together.",
    ],
    questions: [
      "Which part of the current workflow creates the most operator rework rather than just elapsed time?",
      "Which system is authoritative when evidence conflicts?",
      "Which decisions are reversible, and which must remain human-owned?",
      "What would make the business sponsor call the pilot a failure after 30 days?",
    ],
  };
}
