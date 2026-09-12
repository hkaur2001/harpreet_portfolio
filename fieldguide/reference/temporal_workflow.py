"""Reference durable workflow for FieldGuide.

This file is intentionally a production architecture reference rather than code
executed by the public Vercel demo. It shows the split FieldGuide expects:
workflow state is deterministic; external I/O happens in retryable activities;
a human approval can suspend the run without losing progress.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from temporalio import activity, workflow
from temporalio.common import RetryPolicy


@dataclass
class DeploymentInput:
    case_id: str
    requester: str
    workflow_id: str


@dataclass
class Recommendation:
    decision: str
    evidence_ids: list[str]
    risk: str
    requires_approval: bool


@activity.defn
async def gather_evidence(payload: DeploymentInput) -> dict:
    """Call approved connectors / MCP tools under scoped identity."""
    return {
        "case_id": payload.case_id,
        "sources": ["request", "policy", "system-history"],
    }


@activity.defn
async def synthesize_recommendation(evidence: dict) -> Recommendation:
    """Run the configured model route and return structured output."""
    return Recommendation(
        decision="hold",
        evidence_ids=list(evidence["sources"]),
        risk="high",
        requires_approval=True,
    )


@activity.defn
async def authorized_write(recommendation: Recommendation, approval: bool) -> dict:
    """Policy layer must re-check action/resource/purpose before writeback."""
    if recommendation.requires_approval and not approval:
        raise PermissionError("human approval is required")
    return {"status": "written", "decision": recommendation.decision}


@workflow.defn
class FieldGuidePilot:
    def __init__(self) -> None:
        self._approval: bool | None = None

    @workflow.signal
    def approve(self, approved: bool) -> None:
        self._approval = approved

    @workflow.run
    async def run(self, payload: DeploymentInput) -> dict:
        evidence = await workflow.execute_activity(
            gather_evidence,
            payload,
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        recommendation = await workflow.execute_activity(
            synthesize_recommendation,
            evidence,
            start_to_close_timeout=timedelta(seconds=45),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        if recommendation.requires_approval:
            await workflow.wait_condition(lambda: self._approval is not None)

        write_result = await workflow.execute_activity(
            authorized_write,
            args=[recommendation, bool(self._approval)],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        return {
            "recommendation": recommendation,
            "write": write_result,
            "approval": self._approval,
        }
