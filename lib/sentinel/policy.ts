import type { PolicyDecision, RemediationAction, RiskLevel } from "./types";

const ACTION_POLICY: Record<RemediationAction, { risk: RiskLevel; permission: string; productionApproval: boolean; alwaysApproval?: boolean }> = {
  no_action: { risk: 0, permission: "READ_INCIDENT", productionApproval: false },
  send_notification: { risk: 1, permission: "SEND_NOTIFICATION", productionApproval: false },
  create_ticket: { risk: 1, permission: "CREATE_TICKET", productionApproval: false },
  refresh_key_cache: { risk: 1, permission: "REFRESH_CACHE", productionApproval: false },
  increase_retry_backoff: { risk: 1, permission: "UPDATE_RETRY_POLICY", productionApproval: true },
  pause_consumer: { risk: 2, permission: "OPERATE_CONSUMER", productionApproval: true },
  restart_service: { risk: 2, permission: "SERVICE_RESTART", productionApproval: true },
  scale_service: { risk: 2, permission: "SERVICE_SCALE", productionApproval: true },
  rollback_deployment: { risk: 3, permission: "DEPLOYMENT_ROLLBACK", productionApproval: true, alwaysApproval: true },
};

export function evaluatePolicy(input: {
  action: RemediationAction;
  environment: "production" | "staging";
  role?: "viewer" | "engineer" | "incident_commander" | "senior_engineer";
}): PolicyDecision {
  const role = input.role ?? "incident_commander";
  const config = ACTION_POLICY[input.action];
  const allowedRoles = config.risk >= 3 ? ["incident_commander", "senior_engineer"] : ["engineer", "incident_commander", "senior_engineer"];
  const allowed = input.action === "no_action" || allowedRoles.includes(role);
  const requiresApproval = allowed && (config.alwaysApproval === true || (input.environment === "production" && config.productionApproval));

  return {
    action: input.action,
    risk: config.risk,
    allowed,
    requiresApproval,
    permission: config.permission,
    reason: !allowed
      ? `${role} is not permitted to request ${input.action}.`
      : requiresApproval
        ? `${input.action} is a risk level ${config.risk} action in ${input.environment}; deterministic policy requires a human approval.`
        : `${input.action} is within the current role and environment policy boundary.`,
  };
}

export function isKnownAction(action: string): action is RemediationAction {
  return action in ACTION_POLICY;
}
