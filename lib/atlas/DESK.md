# Atlas Financial Research Desk

Goal: turn conflicting financial data into a cited analyst handoff, then scope a safe first deployment. This public demonstration uses a fictional financial-data provider, Aster Data Systems. It has no Bloomberg, S&P Global, Rogo, or Kensho data, connections, affiliation, or endorsement. It is not investment advice or a rating system.

## Runtime architecture

Next.js serves the React research surface and request-validated `/api/atlas/research`. The server sends the selected task, bounded question, feedback, approved-browser rules, and source metadata to the OpenAI Responses API with `store: false`. The provider chooses `read_source` and `calculate_metric` calls. Server code authorizes source IDs before returning content, validates exactly typed tool arguments, enforces source prerequisites, and performs arithmetic. Tool results return to the model, which selects further tools and produces a strict structured brief. No prewritten brief or deterministic fallback replaces a failed model.

The controller requires approved financials F02, superseded draft F04, policy F06, and the selected task's three metrics. Limits: four evidence rounds, sixteen tool calls, three attempts per provider call, fifteen-second per-attempt timeout, fifty-five-second overall provider budget, no new call after forty-five seconds. The final brief must cite actually inspected sources, include calculation prerequisites, and match the computed structured numeric values and units. Semantic truth, complete citation entailment, and claims in prose still require human review; structural green checks are not a model accuracy score.

## Financial judgment made inspectable

Six source documents include an approved H1 statement, management commentary, a superseded draft, methodology and release policy. Approved revenue is USD480m, not draft USD510m. Reported growth14.285714% is not management's9% organic growth. Adjusted EBITDA margin20%, operating cash conversion62.5%, net leverage2.916667x and20%-downside leverage3.645833x are independently calculated. The USD30m source discrepancy is not a comparable-period revenue decline. Annualized H1 EBITDA is not contractual TTM EBITDA, so actual covenant compliance cannot be determined. Cash conversion is operating cash flow/EBITDA, not free cash flow. Forecast synergies are not realized savings.

## Review and procedural memory

Reviewers can request reinvestigation and see run IDs and a revision summary. Source facts and authorization remain fixed. A proposed process rule is not automatically learned: the human must accept it. Up to six rules persist in versioned localStorage in that browser, can be removed, and become untrusted context in subsequent runs. This is procedural memory, not model training, shared enterprise knowledge, or production identity. Questions, drafts, and feedback are not intentionally persisted by this application. Export is a user-triggered local download, not an external-send agent tool. Marking reviewed is browser UI state, not a signed release approval. Provider retention is governed by the configured account; `store:false` is not a zero-retention guarantee.

## Evidence and tests

`test:atlas:desk:unit` independently checks six numeric answers, source boundaries and benchmark input edges. `test:atlas:desk:contracts` runs the actual server tool loop with a test-only provider, covering all three tasks, bad numeric fields, invented citations, unavailable sources, unauthorized tools, missing policy, outages, malformed input, concurrency and rate limits. Desktop/mobile browser tests cover one-click use, original-source inspection, review, export, correction/re-run, explicitly accepted memory, errors, benchmarks and overflow. The illustrative time calculator deducts human-review time and shows negative savings as added effort; no measured customer savings are claimed.

## Before an enterprise rollout

Replace public synthetic sources with authenticated tenant-aware connectors and provider/data-license reviews. Enforce authorization in retrieval independently of the model, rotate secrets, add distributed quotas and cost caps, signed human approvals, persistent audit/redaction and deletion policies, durable execution, contractual methodologies and a representative domain-expert eval set. The public demo uses per-instance rate limits, not distributed denial-of-service protection. It does not implement enterprise SSO, tenant isolation, live licensed financial feeds, regulatory certification, trading or rating authority. Its bounded pilot proposes shadow-mode gates and outcome measurements for validating those capabilities with operators.
