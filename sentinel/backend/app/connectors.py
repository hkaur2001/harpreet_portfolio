from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from .security import classify_external_content


class LogsConnector(Protocol):
    def search(self, service: str, query: str, lookback_minutes: int) -> list[dict[str, Any]]: ...


class MetricsConnector(Protocol):
    def query(self, service: str, metric: str | None, lookback_minutes: int) -> list[dict[str, Any]]: ...


class DeploymentConnector(Protocol):
    def recent(self, service: str, lookback_minutes: int) -> list[dict[str, Any]]: ...


class DatabaseDiagnosticsConnector(Protocol):
    def diagnose(self, service: str, query_kind: str) -> dict[str, Any]: ...


class KnowledgeConnector(Protocol):
    def search(self, service: str, query: str) -> list[dict[str, Any]]: ...


@dataclass
class DemoCloud:
    """A deterministic infrastructure adapter used by tests, local demos, and MCP tools."""

    incident_id: str = "INC-1842"
    service: str = "payment-service"

    def service_health(self, service: str) -> dict[str, Any]:
        return {"service": service, "api": "degraded", "database": "healthy", "gateway": "healthy"}

    def metrics(self, service: str, metric: str | None = None, lookback_minutes: int = 30) -> list[dict[str, Any]]:
        rows = [
            {"name": "api_error_rate", "baseline": 0.2, "current": 17.0, "unit": "%"},
            {"name": "db_pool_utilization", "baseline": 41.0, "current": 98.0, "unit": "%"},
            {"name": "p95_latency", "baseline": 220, "current": 2180, "unit": "ms"},
            {"name": "database_cpu", "baseline": 36, "current": 39, "unit": "%"},
        ]
        if metric:
            rows = [row for row in rows if metric.lower() in str(row["name"]).lower()]
        return [{**row, "service": service, "lookback_minutes": lookback_minutes} for row in rows]

    def logs(self, service: str, query: str, lookback_minutes: int = 30) -> list[dict[str, Any]]:
        raw = [
            "database connection acquisition timed out after 2000ms",
            "remaining connection slots are reserved; request failed",
            "active=98 idle=2 waiters=421 max=100",
        ]
        return [
            {
                "service": service,
                "message": classified.text,
                "trust": classified.trust,
                "injection_signals": list(classified.injection_signals),
                "query": query,
                "lookback_minutes": lookback_minutes,
            }
            for classified in (classify_external_content(message) for message in raw)
        ]

    def deployments(self, service: str, lookback_minutes: int = 120) -> list[dict[str, Any]]:
        return [{
            "deployment_id": "deploy-827",
            "service": service,
            "commit_sha": "a81d9c4",
            "version": "payments-2026.09.04.3",
            "changes": ["worker_concurrency: 20 -> 60", "retry_count: 2 -> 3"],
            "lookback_minutes": lookback_minutes,
        }]

    def database(self, service: str, query_kind: str) -> dict[str, Any]:
        return {
            "service": service,
            "query_kind": query_kind,
            "reachable": True,
            "primary_status": "healthy",
            "connections_used": 98,
            "connections_max": 100,
            "cpu_percent": 39,
            "replication_lag_ms": 7,
        }

    def runbooks(self, service: str, query: str) -> list[dict[str, Any]]:
        return [{
            "id": "DB-014",
            "service": service,
            "title": "Database connection pool exhaustion",
            "content": "If DB host health is normal but pool utilization exceeds 95% after a concurrency increase, restore the previous concurrency or roll back the triggering deployment. Verify pool waiters return to baseline.",
            "query": query,
            "trust": "trusted_document",
        }]

    def incidents(self, service: str, query: str) -> list[dict[str, Any]]:
        return [{
            "id": "INC-1511",
            "service": service,
            "title": "Checkout timeouts after worker scale-up",
            "root_cause": "Connection pool exhaustion",
            "resolution": "Rolled back concurrency increase",
            "query": query,
        }]

    def git_changes(self, service: str, deployment_id: str) -> dict[str, Any]:
        deployment = self.deployments(service)[0]
        return {
            "deployment_id": deployment_id,
            "commit_sha": deployment["commit_sha"],
            "changes": deployment["changes"] if deployment_id == deployment["deployment_id"] else [],
        }
