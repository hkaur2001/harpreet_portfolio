# Sentinel architecture

## System shape

Sentinel is deliberately built around **one primary Investigation Agent**. Logs, metrics, deployment history, database diagnostics, source changes, runbooks, and prior incidents are tools/connectors—not separate agents.

```text
React / Next.js dashboard
          |
          v
Investigation API / runtime
          |
   Investigation Agent
          |
  +-------+---------+---------+
  |       |         |         |
 logs   metrics  deploys   database
  |       |         |         |
  +-------+---- Tool Gateway--+
               |
        connector adapters
               |
       simulated demo cloud

Investigation recommendation
          |
          v
 deterministic policy engine
       /         |          \
   execute    approval      deny
      |           |
      +------> simulated remediation
                    |
                 verify
                    |
                postmortem
```

## Why one agent

The failure mode this project avoids is confusing architecture complexity with agent sophistication. A single investigator gives one coherent state/history, one tool budget, one authorization boundary, and one execution trace. A specialized agent would only be justified when evaluation demonstrates that a separate context, model, or policy boundary improves measurable outcomes.

## Investigation lifecycle

The conceptual state machine is:

`NEW → TRIAGING → INVESTIGATING → DIAGNOSED | NEEDS_INFO → REMEDIATION_PLAN → AUTO_APPROVED | NEEDS_APPROVAL → EXECUTING → VERIFYING → CLOSED | ESCALATED`

The public implementation compresses some persistence states but preserves the important safety transition: **diagnosis never grants execution authority**.

## Tool gateway

Each tool declares:
- name and purpose
- strict argument contract
- permission
- risk level
- timeout
- retry budget
- audit requirement

The model sees bounded operations rather than credentials or infrastructure SDKs. Database access is diagnostics-only; arbitrary SQL is not a tool. Arbitrary shell execution is not a tool.

## Connector boundary

The standalone Python runtime defines protocols for logs, metrics, deployments, database diagnostics, and knowledge. `DemoCloud` implements them with deterministic fixtures. Production adapters could target Datadog/Grafana, CloudWatch, Kubernetes, GitHub, a deployment platform, PostgreSQL, Jira/Slack, or internal knowledge systems without changing the model's authority model.

## Knowledge and RAG

The database schema supports versioned runbooks/documents plus pgvector embeddings. Retrieval should combine:
1. semantic similarity
2. service/environment metadata filters
3. document recency/version
4. operational relevance

The live simulator keeps the corpus intentionally small and inspectable. The point is to exercise retrieval and grounding behavior without pretending synthetic documents are an enterprise corpus.

## Model routing

The deployed runtime routes simpler incidents to a lower-cost model and severity-1, ambiguous, or adversarial scenarios to a stronger model. Every run records model, input/output tokens, estimated cost, and tool count so routing can be evaluated rather than assumed to be cheaper.

## Persistence model

`backend/db/schema.sql` includes incidents, events, runs, steps, tool calls, evidence, hypotheses, remediation plans, approvals, actions, deployments, runbooks, documents, evaluation tasks/trials/scores, and audit logs. An investigation can therefore be reconstructed after the fact.
