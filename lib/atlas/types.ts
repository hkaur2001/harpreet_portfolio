export type AtlasPlan = {
  goal: string;
  recommendedWorkflowIndex: number;
  rationale: string;
  assumptions: string[];
  discoveryQuestions: string[];
  phases: { dayRange: string; objective: string; actions: string[]; owner: string }[];
  launchGates: string[];
  risks: string[];
  metrics: string[];
  evidenceIds: string[];
};

export type AtlasAgentResult = {
  runId: string;
  mode: "live";
  model: string;
  plan: AtlasPlan;
  trace: { tool: string; summary: string; evidenceId: string }[];
  metrics: { modelCalls: number; toolCalls: number; latencyMs: number; inputTokens: number; outputTokens: number; providerRetries: number };
};
