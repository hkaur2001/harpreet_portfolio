from __future__ import annotations

import time
from dataclasses import asdict, dataclass
from typing import Any, Callable

from .connectors import DemoCloud


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    permission: str
    risk: str
    timeout_ms: int
    retries: int
    audit: bool = True


TOOL_SPECS = {
    "get_service_health": ToolSpec("get_service_health", "Read service and dependency health.", "READ_SERVICE_HEALTH", "LOW", 1500, 2),
    "query_metrics": ToolSpec("query_metrics", "Read baseline/current metrics.", "READ_METRICS", "LOW", 1500, 2),
    "search_logs": ToolSpec("search_logs", "Search untrusted log observations.", "READ_LOGS", "LOW", 1800, 2),
    "get_recent_deployments": ToolSpec("get_recent_deployments", "Read recent deployments.", "READ_DEPLOYMENTS", "LOW", 1400, 2),
    "query_database": ToolSpec("query_database", "Read bounded database diagnostics; arbitrary SQL is not accepted.", "READ_DATABASE_DIAGNOSTICS", "LOW", 1800, 2),
    "search_runbooks": ToolSpec("search_runbooks", "Search trusted operational runbooks.", "READ_RUNBOOKS", "LOW", 1300, 2),
    "get_git_changes": ToolSpec("get_git_changes", "Read the bounded change summary for a known deployment.", "READ_SOURCE_CHANGES", "LOW", 1200, 1),
    "search_incidents": ToolSpec("search_incidents", "Search prior incident summaries.", "READ_INCIDENT_HISTORY", "LOW", 1200, 1),
}


class ToolGateway:
    def __init__(self, cloud: DemoCloud | None = None) -> None:
        self.cloud = cloud or DemoCloud()

    def catalog(self) -> list[dict[str, Any]]:
        return [asdict(spec) for spec in TOOL_SPECS.values()]

    def execute(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        spec = TOOL_SPECS.get(name)
        if spec is None:
            raise ValueError(f"Unknown tool: {name}")

        operations: dict[str, Callable[[], Any]] = {
            "get_service_health": lambda: self.cloud.service_health(str(arguments["service"])),
            "query_metrics": lambda: self.cloud.metrics(str(arguments["service"]), arguments.get("metric"), int(arguments.get("lookback_minutes", 30))),
            "search_logs": lambda: self.cloud.logs(str(arguments["service"]), str(arguments.get("query", "error")), int(arguments.get("lookback_minutes", 30))),
            "get_recent_deployments": lambda: self.cloud.deployments(str(arguments["service"]), int(arguments.get("lookback_minutes", 120))),
            "query_database": lambda: self.cloud.database(str(arguments["service"]), str(arguments.get("query_kind", "health"))),
            "search_runbooks": lambda: self.cloud.runbooks(str(arguments["service"]), str(arguments.get("query", "incident"))),
            "get_git_changes": lambda: self.cloud.git_changes(str(arguments["service"]), str(arguments["deployment_id"])),
            "search_incidents": lambda: self.cloud.incidents(str(arguments["service"]), str(arguments.get("query", "incident"))),
        }

        started = time.perf_counter()
        result = operations[name]()
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "tool": name,
            "permission": spec.permission,
            "risk": spec.risk,
            "latency_ms": elapsed_ms,
            "audit": spec.audit,
            "result": result,
        }
