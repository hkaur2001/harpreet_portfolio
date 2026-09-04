export type RiskLevel = 0 | 1 | 2 | 3;
export type ToolStatus = "ok" | "error" | "guarded";
export type InvestigationMode = "live" | "deterministic";

export type Evidence = {
  id: string;
  source: "metrics" | "logs" | "deployments" | "database" | "health" | "runbook" | "git" | "incident";
  title: string;
  detail: string;
  trust: "trusted_system" | "untrusted_observation" | "trusted_document";
  relevance: number;
};

export type ToolTrace = {
  index: number;
  tool: string;
  purpose: string;
  status: ToolStatus;
  latencyMs: number;
  summary: string;
  evidenceIds: string[];
};

export type MetricPoint = { name: string; baseline: number; current: number; unit: string };
export type LogRecord = { timestamp: string; level: string; message: string; source: string };
export type DeploymentRecord = {
  deploymentId: string;
  commitSha: string;
  timestamp: string;
  author: string;
  version: string;
  changes: string[];
};

export type IncidentScenario = {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  severity: "SEV-1" | "SEV-2" | "SEV-3";
  service: string;
  environment: "production" | "staging";
  category:
    | "database_connection_exhaustion"
    | "api_latency_spike"
    | "bad_deployment"
    | "memory_leak"
    | "service_down"
    | "network_failure"
    | "schema_change"
    | "authentication_failure"
    | "queue_backlog"
    | "unknown_failure";
  detectedAt: string;
  metrics: MetricPoint[];
  logs: LogRecord[];
  deployments: DeploymentRecord[];
  database: Record<string, string | number | boolean>;
  health: Record<string, string | number | boolean>;
  runbooks: Array<{ id: string; title: string; content: string; service: string; updatedAt: string }>;
  pastIncidents: Array<{ id: string; title: string; rootCause: string; resolution: string }>;
  groundTruth: {
    rootCause: string;
    evidence: string[];
    expectedAction: RemediationAction;
    expectedConfidence: number;
    recovery: Record<string, number | string>;
  };
};

export type RemediationAction =
  | "rollback_deployment"
  | "restart_service"
  | "scale_service"
  | "refresh_key_cache"
  | "increase_retry_backoff"
  | "pause_consumer"
  | "create_ticket"
  | "send_notification"
  | "no_action";

export type PolicyDecision = {
  action: RemediationAction;
  risk: RiskLevel;
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  permission: string;
};

export type Diagnosis = {
  rootCause: string;
  confidence: number;
  summary: string;
  evidenceIds: string[];
  alternatives: Array<{ hypothesis: string; confidence: number; reason: string }>;
  remediation: {
    action: RemediationAction;
    reason: string;
    expectedImpact: string;
    reversible: boolean;
  };
  escalation: { required: boolean; reason: string };
};

export type InvestigationResult = {
  runId: string;
  incidentId: string;
  scenarioId: string;
  state: "DIAGNOSED" | "NEEDS_INFO" | "ESCALATED";
  mode: InvestigationMode;
  model: string;
  diagnosis: Diagnosis;
  policy: PolicyDecision;
  evidence: Evidence[];
  trace: ToolTrace[];
  metrics: {
    latencyMs: number;
    modelCalls: number;
    toolCalls: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    retries: number;
    promptInjectionSignals: number;
  };
};
