import { NextRequest, NextResponse } from "next/server";
import { evaluatePolicy, isKnownAction } from "@/lib/sentinel/policy";
import { getScenario } from "@/lib/sentinel/scenarios";

export async function POST(request: NextRequest) {
  let payload: { scenarioId?: string; action?: string; approved?: boolean };
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  const scenario = payload.scenarioId ? getScenario(payload.scenarioId) : undefined;
  if (!scenario) return NextResponse.json({ error: "Unknown Sentinel scenario." }, { status: 404 });
  if (!payload.action || !isKnownAction(payload.action)) return NextResponse.json({ error: "Unknown remediation action." }, { status: 400 });
  if (payload.action !== scenario.groundTruth.expectedAction) {
    return NextResponse.json({ error: "The simulator rejected an action that does not match the scenario's bounded recovery contract." }, { status: 409 });
  }

  const policy = evaluatePolicy({ action: payload.action, environment: scenario.environment, role: "incident_commander" });
  if (!policy.allowed) return NextResponse.json({ error: policy.reason, policy }, { status: 403 });
  if (policy.requiresApproval && payload.approved !== true) return NextResponse.json({ error: "Human approval required.", policy }, { status: 428 });

  const resolvedAt = new Date().toISOString();
  const actionLabel = payload.action.replaceAll("_", " ");
  const postmortem = {
    incident: scenario.incidentId,
    impact: scenario.title,
    rootCause: scenario.groundTruth.rootCause,
    remediation: actionLabel,
    resolvedAt,
    preventiveActions: [
      "Add a regression check for the triggering failure signature.",
      "Tighten the relevant release or capacity guardrail.",
      "Ensure the operational runbook contains the evidence needed for faster future diagnosis.",
    ],
  };

  return NextResponse.json({
    status: "recovered",
    simulated: true,
    policy,
    action: payload.action,
    before: Object.fromEntries(scenario.metrics.map((metric) => [metric.name, metric.current])),
    after: scenario.groundTruth.recovery,
    verification: "Recovery metrics moved toward the known-good baseline in the simulated environment.",
    postmortem,
  });
}
