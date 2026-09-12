# FieldGuide technology decisions

This document records why technologies appear in FieldGuide. The project deliberately avoids 'tool soup': a technology is live, implemented as a reference, or listed as an alternative — never silently presented as deployed.

## 1. Agent API — OpenAI Responses API

**Status:** live in the public custom-workflow analysis endpoint.

Why:
- native tool-oriented agent API surface
- structured, bounded server-side execution
- existing retry/backoff and provider-failure handling in the portfolio
- easy to keep the model behind a deterministic application contract

FieldGuide does not use the model for identity, authorization, approval state, or write-policy decisions.

## 2. Tool interoperability — MCP v2

**Status:** implemented reference server in `reference/mcp_server.py`.

Why:
- keeps enterprise tools behind a typed, bounded interface
- lets the agent request capabilities instead of receiving arbitrary shell/database access
- makes tool descriptions and authority reviewable as a deployment artifact

The reference surface is read-oriented and intentionally omits arbitrary SQL, arbitrary shell execution, and autonomous approval/write tools.

## 3. Durable long-horizon execution — Temporal

**Status:** implemented reference workflow in `reference/temporal_workflow.py`.

Why:
- durable state across worker restarts
- first-class retry semantics for non-deterministic activities
- signals/waits for human approval
- useful mental model for workflows that may pause for minutes, hours, or days

**Alternative considered:** Vercel Workflows / Workflow Development Kit for applications already centered on Vercel. It is attractive for durable TypeScript workflows close to the web product. Temporal is shown here because enterprise deployments often need infrastructure-independent workflow semantics and explicit worker/activity boundaries.

## 4. Authorization — policy-as-code

**Status:** OPA/Rego reference in `reference/policy.rego`; deterministic TypeScript policy gates live in the public simulation.

Why:
- default-deny behavior is auditable
- action/resource/purpose/approval can be evaluated outside the model
- policy can be tested independently from prompts

**Alternative considered:** Cedar for organizations that prefer an authorization language centered on principal/action/resource policy and formal least-privilege modeling. The important design decision is externalized authorization, not the policy-language brand.

## 5. Observability — OpenTelemetry + agent traces

**Status:** production reference pattern; public demo exposes an inspectable run trace.

Production expectation:
- one trace per run
- spans for tool/model/policy/human steps
- model/provider, latency, tokens, and cost attributes
- evidence IDs and retry metadata
- redaction before telemetry export
- export to the customer's approved observability/SIEM stack

**Alternative/product layer:** Langfuse can sit on top of OpenTelemetry-style traces for agent observability, evals, prompt/version analysis, and experiments. FieldGuide does not claim a live Langfuse deployment.

## 6. Model routing

**Status:** live routing concept in the public runbook.

Principle:
- deterministic code for identity, authorization, state, and write gates
- fast/low-cost model for extraction and bounded normalization
- frontier reasoning model only for ambiguous cross-source synthesis

The release gate is the workflow rubric. A more expensive model should only remain in the route if it produces enough measurable quality improvement to justify latency and cost.

## 7. Deployment perimeter

**Status:** live strategy surface, reference infrastructure only.

FieldGuide models four enterprise deployment modes:
- managed
- customer VPC
- on-prem
- air-gapped

A real deployment would pair that choice with Kubernetes/Terraform or the customer's equivalent platform tooling, customer-managed networking, secrets brokering, and audit export.

## 8. Evaluation

**Status:** live deterministic gates + repository golden-set dataset.

FieldGuide uses different evaluators for different failure modes:
- deterministic code for authorization/policy/schema/fault-recovery properties
- model graders for semantic qualities when appropriate
- calibrated domain-expert review for deployment usefulness and judgment
- product/business metrics for real outcome improvement

Do not collapse these into one 'AI accuracy' number.

## 9. Deliberately not used

- A generic agent framework solely to increase the framework count.
- Autonomous arbitrary-code execution in the public demo.
- A vector database where the project does not need semantic retrieval.
- Browser-held enterprise credentials.
- Model-based authorization.

The project is meant to show deployment judgment: choosing fewer components can be a stronger technical decision than naming every available tool.