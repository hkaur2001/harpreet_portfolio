from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .evaluation import evaluation_dict
from .policy import evaluate_action
from .tools import ToolGateway

app = FastAPI(
    title="Sentinel API",
    version="1.0.0",
    description="Reference API for bounded incident investigation, policy evaluation, and simulated remediation.",
)
gateway = ToolGateway()


class IncidentRequest(BaseModel):
    scenario: str = "database_connection_exhaustion"
    service: str = "payment-service"


class InvestigationRequest(BaseModel):
    incident_id: str
    service: str = "payment-service"


class ActionRequest(BaseModel):
    action: str
    environment: str = "production"
    role: str = "incident_commander"
    approved: bool = False


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "tools": len(gateway.catalog()), "remediation_target": "simulated infrastructure only"}


@app.get("/tools")
def tools() -> list[dict[str, object]]:
    return gateway.catalog()


@app.post("/simulation/incidents")
def simulate_incident(payload: IncidentRequest) -> dict[str, object]:
    supported = {
        "database_connection_exhaustion",
        "api_latency_spike",
        "bad_deployment",
        "memory_leak",
        "service_down",
        "network_failure",
        "schema_change",
        "authentication_failure",
        "queue_backlog",
        "unknown_failure",
    }
    if payload.scenario not in supported:
        raise HTTPException(status_code=400, detail="Unknown scenario")
    return {
        "incident_id": "INC-DEMO",
        "scenario": payload.scenario,
        "service": payload.service,
        "status": "NEW",
        "simulated": True,
    }


@app.post("/incidents/{incident_id}/investigate")
def investigate(incident_id: str, payload: InvestigationRequest) -> dict[str, object]:
    if payload.incident_id != incident_id:
        raise HTTPException(status_code=400, detail="Path and request incident IDs must match")
    trace = [
        gateway.execute("get_service_health", {"service": payload.service}),
        gateway.execute("query_metrics", {"service": payload.service, "metric": None, "lookback_minutes": 30}),
        gateway.execute("search_logs", {"service": payload.service, "query": "database timeout", "lookback_minutes": 30}),
        gateway.execute("get_recent_deployments", {"service": payload.service, "lookback_minutes": 120}),
        gateway.execute("query_database", {"service": payload.service, "query_kind": "connections"}),
        gateway.execute("get_git_changes", {"service": payload.service, "deployment_id": "deploy-827"}),
        gateway.execute("search_runbooks", {"service": payload.service, "query": "connection pool"}),
    ]
    return {
        "incident_id": incident_id,
        "status": "DIAGNOSED",
        "root_cause": "Deployment deploy-827 raised worker concurrency from 20 to 60 and exhausted the database connection pool.",
        "confidence": 0.93,
        "recommended_action": "rollback_deployment",
        "trace": trace,
        "note": "This endpoint is the deterministic reference path. The deployed Next.js product adds a live OpenAI tool-selection loop over equivalent contracts.",
    }


@app.post("/actions/execute")
def execute_action(payload: ActionRequest) -> dict[str, object]:
    decision = evaluate_action(payload.action, payload.environment, payload.role)
    if not decision.allowed:
        raise HTTPException(status_code=403, detail=decision.reason)
    if decision.requires_approval and not payload.approved:
        raise HTTPException(status_code=428, detail="Human approval required")
    return {
        "status": "simulated",
        "action": payload.action,
        "policy": {
            "permission": decision.permission,
            "risk": int(decision.risk),
            "requires_approval": decision.requires_approval,
        },
        "message": "No real infrastructure was modified.",
    }


@app.get("/evals/run")
def run_evals() -> dict[str, int]:
    return evaluation_dict()
