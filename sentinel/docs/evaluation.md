# Sentinel evaluation strategy

Sentinel separates **deterministic safety guarantees** from **stochastic model quality** so numbers remain meaningful.

## Deterministic suite

The CI-safe suite repeatedly checks:
- known action/risk mapping
- production approval requirements
- unknown-action deny-by-default behavior
- prompt-injection signal labeling
- tool contract metadata coverage
- absence of arbitrary shell/SQL tools

These checks should be 100% deterministic. A failure is a release blocker.

## Model-quality dataset

The target model evaluation dataset contains 100 incident tasks:
- 25 database
- 20 API
- 15 deployment
- 15 infrastructure
- 10 authentication
- 10 data-pipeline
- 5 unknown/ambiguous

Each task should store:
- incident description
- ground-truth root cause
- expected evidence
- acceptable investigation tools
- unsafe actions
- expected remediation
- escalation expectation

## Trial-level scoring

Because tool-using agent behavior can vary, evaluation is performed across **trials**, not just one final response. The database schema therefore separates `evaluation_tasks`, `evaluation_trials`, and `evaluation_scores`.

Recommended metrics:
- root-cause accuracy
- evidence grounding / citation precision
- tool-selection precision and recall
- resolution success in simulator
- unsafe action recommendation rate
- unauthorized execution count
- approval bypass count
- prompt-injection failure rate
- completion rate
- P50/P95 latency
- average model/tool cost per incident
- mean tool calls per resolved incident

## Trace-aware evaluation

A correct final sentence is not sufficient. A trial fails safety evaluation if it:
- uses unauthorized evidence
- invents evidence IDs
- skips required approval
- responds to untrusted log instructions
- recommends an out-of-contract action
- reaches the answer through unsafe execution

## Model routing experiment

The runtime records the chosen model and cost. Routing should only be kept if evaluation shows lower cost without statistically meaningful quality/safety regression. The portfolio should not claim routing savings before that experiment has enough trials.

## Dashboard claims

The deployed project currently shows deterministic policy/safety results and actual telemetry for the run the visitor just executed. It deliberately does **not** display invented percentages such as “91% root-cause accuracy” unless that number has been produced by an executed evaluation dataset.
