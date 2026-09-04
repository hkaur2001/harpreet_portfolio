from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum


class RiskLevel(IntEnum):
    INFORMATIONAL = 0
    REVERSIBLE = 1
    PRODUCTION_OPERATIONAL = 2
    DESTRUCTIVE = 3


@dataclass(frozen=True)
class ActionPolicy:
    permission: str
    risk: RiskLevel
    production_approval: bool = False
    always_approval: bool = False


@dataclass(frozen=True)
class PolicyDecision:
    action: str
    permission: str
    risk: RiskLevel
    allowed: bool
    requires_approval: bool
    reason: str


POLICIES: dict[str, ActionPolicy] = {
    "no_action": ActionPolicy("READ_INCIDENT", RiskLevel.INFORMATIONAL),
    "send_notification": ActionPolicy("SEND_NOTIFICATION", RiskLevel.REVERSIBLE),
    "create_ticket": ActionPolicy("CREATE_TICKET", RiskLevel.REVERSIBLE),
    "refresh_key_cache": ActionPolicy("REFRESH_CACHE", RiskLevel.REVERSIBLE),
    "increase_retry_backoff": ActionPolicy("UPDATE_RETRY_POLICY", RiskLevel.REVERSIBLE, production_approval=True),
    "pause_consumer": ActionPolicy("OPERATE_CONSUMER", RiskLevel.PRODUCTION_OPERATIONAL, production_approval=True),
    "restart_service": ActionPolicy("SERVICE_RESTART", RiskLevel.PRODUCTION_OPERATIONAL, production_approval=True),
    "scale_service": ActionPolicy("SERVICE_SCALE", RiskLevel.PRODUCTION_OPERATIONAL, production_approval=True),
    "rollback_deployment": ActionPolicy("DEPLOYMENT_ROLLBACK", RiskLevel.DESTRUCTIVE, production_approval=True, always_approval=True),
}


def evaluate_action(action: str, environment: str, role: str) -> PolicyDecision:
    policy = POLICIES.get(action)
    if policy is None:
        return PolicyDecision(action, "UNKNOWN", RiskLevel.DESTRUCTIVE, False, False, "Unknown action is denied by default.")

    if action == "no_action":
        allowed = True
    elif policy.risk >= RiskLevel.DESTRUCTIVE:
        allowed = role in {"incident_commander", "senior_engineer"}
    else:
        allowed = role in {"engineer", "incident_commander", "senior_engineer"}

    requires_approval = allowed and (
        policy.always_approval
        or (environment == "production" and policy.production_approval)
    )

    if not allowed:
        reason = f"Role {role!r} lacks {policy.permission}."
    elif requires_approval:
        reason = f"Risk level {int(policy.risk)} action in {environment} requires a human approval."
    else:
        reason = "Action is inside the current deterministic policy boundary."

    return PolicyDecision(
        action=action,
        permission=policy.permission,
        risk=policy.risk,
        allowed=allowed,
        requires_approval=requires_approval,
        reason=reason,
    )
