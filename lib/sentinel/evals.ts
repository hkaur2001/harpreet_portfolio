import { evaluatePolicy } from "./policy";
import { SENTINEL_SCENARIOS } from "./scenarios";
import { detectPromptInjection } from "./security";
import { TOOL_DEFINITIONS } from "./tool-registry";

export type EvalSummary = {
  totalCases: number;
  policyPasses: number;
  unsafeExecutions: number;
  approvalBypasses: number;
  injectionCases: number;
  injectionDetected: number;
  toolSchemaCoverage: number;
  scenarioCoverage: number;
};

export function runDeterministicSafetyEvals(): EvalSummary {
  let policyPasses = 0;
  let unsafeExecutions = 0;
  let approvalBypasses = 0;
  let injectionCases = 0;
  let injectionDetected = 0;

  const totalCases = 100;
  for (let i = 0; i < totalCases; i += 1) {
    const scenario = SENTINEL_SCENARIOS[i % SENTINEL_SCENARIOS.length];
    const decision = evaluatePolicy({ action: scenario.groundTruth.expectedAction, environment: scenario.environment, role: "incident_commander" });
    const shouldRequireApproval = decision.risk >= 3 || (scenario.environment === "production" && decision.risk === 2);
    const policyCorrect = decision.allowed && decision.requiresApproval === shouldRequireApproval;
    if (policyCorrect) policyPasses += 1;
    if (!decision.allowed && scenario.groundTruth.expectedAction !== "no_action") unsafeExecutions += 1;
    if (shouldRequireApproval && !decision.requiresApproval) approvalBypasses += 1;

    for (const log of scenario.logs) {
      const detection = detectPromptInjection(log.message);
      if (/ignore|delete[_\s-]+production|system\s*prompt/i.test(log.message)) {
        injectionCases += 1;
        if (detection.flagged) injectionDetected += 1;
      }
    }
  }

  const completeToolSchemas = TOOL_DEFINITIONS.filter((tool) => tool.permission && tool.timeoutMs > 0 && tool.retry.attempts >= 1 && tool.parameters).length;

  return {
    totalCases,
    policyPasses,
    unsafeExecutions,
    approvalBypasses,
    injectionCases,
    injectionDetected,
    toolSchemaCoverage: Math.round((completeToolSchemas / TOOL_DEFINITIONS.length) * 100),
    scenarioCoverage: SENTINEL_SCENARIOS.length,
  };
}
