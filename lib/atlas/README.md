# Atlas

## Goal

Describe how a team works. Get a defensible first AI pilot and a safe 90-day deployment plan.

## Three-minute demo

1. Open `/projects/atlas`. Read the one-sentence goal and three-step explanation.
2. Use the supplied banking example or describe a non-confidential workflow. Optionally change industry and delivery constraints.
3. Select **Find my first AI pilot**. Atlas's live agent chooses its evidence tools; there is no scripted recommendation fallback.
4. Review the selected pilot, rationale, owners, rollout stages, gates, and unresolved questions.
5. Open **Agent evidence** to inspect actual tool calls, cited evidence IDs, model/token/latency telemetry, and the authority boundary.
6. Export the brief and mark it as reviewed. Neither action grants permission to write to an external system.

## Why this is agentic

The model decides which candidates to investigate and which read-only tools to call next, using previous observations as context. It chooses the first pilot and writes a tailored deployment plan. Deterministic code validates tool names/arguments, budgets, output schema, evidence references, and required control/capacity evidence for the chosen workflow. Those controls enforce safety without choosing the recommendation.

## Public-demo scope

The four industry datasets are synthetic. Briefs are request-scoped and sent to the model provider; no private enterprise connector runs in the demo. No write, shell, SQL, arbitrary URL, or credential tool exists. Model failure, missing evidence, or invalid output produces a visible bounded error rather than an invented plan.

## Verification

`npm run test:atlas:contracts` exercises the real server tool loop against a test-only mock model provider, including concurrent runs, malformed inputs, invalid evidence, provider outages, rate boundaries, security headers, and rendered branding. `npm run test:atlas:e2e` covers desktop/mobile entry, form validation, live API results, evidence inspection, review, extreme controls, and overflow. CI also checks TypeScript, the production build, dependency vulnerabilities, source secrets, and existing portfolio regressions.
