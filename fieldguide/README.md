# FieldGuide — Enterprise AI Deployment Workbench

FieldGuide is a portfolio project for the work between an enterprise workflow and a production agent: discovery, workflow mapping, use-case sequencing, runbook design, permissions, human approval, evals, rollout, and the feedback loop after launch.

The public project uses **synthetic enterprise scenarios**. It does not claim access to or implementation inside a customer environment.

## What problem it solves

Most AI prototypes start after the most consequential decisions have already been skipped:

- Which workflow should go first?
- What is the operator actually responsible for?
- Which systems are authoritative?
- Which actions may the agent read, recommend, or write?
- Which exceptions require a named human?
- What is the quality bar?
- How will a model/runbook/context change be regression-tested?
- What does the rollout sequence look like?
- What happens when the worker or model provider fails?

FieldGuide makes those decisions explicit and executable.

## Public workflow

1. **Discover** — inspect actors, systems, baseline friction, hidden pain, and failure cost.
2. **Design** — score candidate workflows by value, readiness, reversibility, sponsor strength, and risk.
3. **Pilot** — run a synthetic historical case through a governed runbook and inspect the trace.
4. **Fault injection** — interrupt the worker after a checkpoint and demonstrate resume semantics.
5. **Evals** — run deterministic golden-set gates across happy-path, high-risk, conflicting-evidence, and prompt-injection slices.
6. **Rollout** — choose managed / customer VPC / on-prem / air-gapped deployment assumptions and build a 30/60/90 sequence.
7. **Custom workflow** — paste a workflow description and generate a deployment hypothesis with live model synthesis or deterministic fallback.

## Technology surface

### Live in the Vercel project

- Next.js 16
- React 19
- TypeScript
- OpenAI Responses API
- Structured JSON strategy synthesis
- deterministic workflow prioritization
- deterministic policy / authority boundaries
- golden-set evaluation
- fault-injection replay
- provider retry and fallback
- GitHub Actions production validation

### Implemented reference components

`reference/mcp_server.py`
- MCP v2 tool surface for enterprise workflow evidence
- read-only tools separated from consequential writes

`reference/policy.rego`
- policy-as-code sketch for per-action authorization
- default deny
- explicit approval requirement for high-impact writes

`reference/temporal_workflow.py`
- durable workflow / activity split
- human approval signal
- retries around non-deterministic work
- resume semantics after worker interruption

These references are intentionally labeled as references; the public Vercel process does not pretend to run a full customer VPC, Temporal cluster, or policy engine.

## Model-routing principle

A deployment should not send every step to the most expensive model.

FieldGuide routes conceptually by work type:

- deterministic code: identity, authorization, state transitions, policy, write gates
- fast model: extraction, normalization, bounded summarization
- frontier reasoning model: ambiguous cross-source synthesis where the quality gain justifies cost

The deployment gate is the **quality rubric**, not the model brand. The cheapest route that clears the required quality bar should win.

## Evaluation philosophy

FieldGuide separates two classes of measurement.

### Hard deterministic gates

These should be pass/fail:
- no approval bypass
- no model-owned authorization
- write actions are isolated
- prompt-injection fixtures remain untrusted data
- required evidence path exists
- malformed inputs return bounded errors
- provider failure returns a usable fallback rather than a raw provider error

### Stochastic / semantic quality

These require repeated model trials and calibrated expert review:
- recommendation quality
- completeness
- relevance
- usefulness to the operator
- groundedness
- quality of escalation questions

A deterministic 100% pass rate is never presented as “100% model accuracy.”

## Production rollout model

FieldGuide defaults to:

**Shadow mode → Assisted production → Bounded automation**

Authority expands only after evidence does. Cohort size should expand before irreversible agent authority.

## Testing

The repository CI validates:
- TypeScript
- production Next.js build
- offline evaluation gates
- concurrent HTTP stress
- invalid-input paths
- provider failure/retry behavior
- FieldGuide public page rendering
- FieldGuide deterministic strategy API
- FieldGuide custom live/fallback strategy API
- deployed-production smoke validation

The goal is not to claim software can never contain a defect. The goal is to make the important failure modes repeatable, observable, and release-blocking.