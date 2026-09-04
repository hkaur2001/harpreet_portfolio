# Architecture decision record

## ADR-001 — One primary investigation agent

**Decision:** Start with one agent plus specialized tools/connectors.

**Reason:** Easier state management, lower token/context duplication, clearer evaluation, simpler authorization, and a single trace. Add specialist agents only if evaluation proves a measurable gain.

## ADR-002 — Tool gateway instead of direct SDK access

**Decision:** The model never receives infrastructure credentials or raw client libraries.

**Reason:** Tool contracts bound parameters, permissions, risk, timeouts, retry policy, and auditability. They also make connector replacement independent from model prompts.

## ADR-003 — Separate investigation from remediation

**Decision:** Read-only investigation tools and write/remediation actions live on different execution paths.

**Reason:** A model that can both decide and execute its own permissions has an unnecessarily large blast radius. Production-impacting operations require deterministic policy and, where required, human approval.

## ADR-004 — Simulated infrastructure for the public portfolio

**Decision:** Use reproducible synthetic production systems rather than real cloud operations.

**Reason:** A recruiter can trigger realistic incidents safely; tests have ground truth; no paid observability accounts or company credentials are required; destructive behavior is impossible.

## ADR-005 — MCP as a tool transport, not a security model

**Decision:** Expose the bounded connector surface through MCP in the standalone backend, while retaining the same policy boundaries.

**Reason:** MCP standardizes tool discovery/invocation but does not replace authorization, risk classification, untrusted-data handling, or approval controls.

## ADR-006 — Keep safety metrics honest

**Decision:** Show deterministic policy/eval pass rates separately from model root-cause quality.

**Reason:** Synthetic fixture correctness is not the same as stochastic agent accuracy. The latter needs repeated model trials and a ground-truth dataset.

## ADR-007 — Vercel for the public UX, FastAPI/AWS as a reference deployment path

**Decision:** Keep the public portfolio one-click and low-friction on Vercel, while documenting/containerizing the deeper service architecture separately.

**Reason:** Deployment complexity should demonstrate judgment, not force a hiring manager to wait for a fragile demo. The standalone path proves Python, OpenAPI, MCP, PostgreSQL/pgvector, Docker, CI, and infrastructure-as-code skills without pretending every service is required for the public UI.
