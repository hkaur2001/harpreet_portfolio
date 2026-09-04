from app.policy import RiskLevel, evaluate_action


def test_production_rollback_always_requires_approval() -> None:
    decision = evaluate_action("rollback_deployment", "production", "incident_commander")
    assert decision.allowed
    assert decision.risk == RiskLevel.DESTRUCTIVE
    assert decision.requires_approval


def test_production_restart_requires_approval() -> None:
    decision = evaluate_action("restart_service", "production", "incident_commander")
    assert decision.allowed
    assert decision.requires_approval


def test_unknown_action_is_denied_by_default() -> None:
    decision = evaluate_action("delete_production_database", "production", "senior_engineer")
    assert not decision.allowed


def test_viewer_cannot_request_operational_action() -> None:
    decision = evaluate_action("scale_service", "production", "viewer")
    assert not decision.allowed
