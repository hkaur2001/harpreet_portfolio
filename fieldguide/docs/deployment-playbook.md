# FieldGuide deployment playbook

## 1. Discovery

Start with the workflow as it exists today, not with an agent idea.

Ask operators:
- What event starts the work?
- What does done mean?
- Which systems are authoritative?
- Where do you copy or reconcile information manually?
- Which exceptions take most of the judgment?
- Which decisions can be reversed cheaply?
- Which actions create legal, financial, customer, security, or operational risk?
- Who is accountable for the final decision?
- What would make you stop trusting the system?

Ask the sponsor:
- What business outcome matters: cycle time, throughput, quality, revenue, risk, capacity, or customer experience?
- Which operator cohort can pilot safely?
- What is the 30-day failure condition?
- What change-management or procurement constraint can block adoption even if the model works?

Ask security / IT:
- Which identity provider is authoritative?
- Can connectors use delegated user identity or only service identities?
- Which systems need read access? Which need write access?
- Which actions require named human approval?
- Which data classes may reach an external model endpoint?
- Which deployment perimeter is acceptable?
- What run-trace retention and SIEM export are required?

## 2. Choose the first workflow

Prefer the workflow that maximizes learning and measurable operator value while keeping the first deployment reversible.

FieldGuide scores:
- business value
- frequency
- standardization
- data readiness
- reversibility
- sponsor readiness
- risk penalty

Do not choose a high-risk write action as the first pilot merely because it creates the most automation theater.

## 3. Define the runbook

Every step should declare:
- input / output contract
- source system
- read or write permission
- model route or deterministic implementation
- retry / timeout behavior
- evidence IDs that must land in the trace
- whether approval is required
- failure / escalation path

## 4. Separate the control plane

The model is allowed to reason. It is not allowed to create its own authority.

Keep outside the prompt:
- identity
- authorization
- credential custody
- approval state
- write policy
- tenant / resource boundary
- audit trail

## 5. Build the golden set before launch

At minimum include:
- common happy paths
- high-risk exception
- conflicting authoritative sources
- missing evidence
- stale evidence
- prompt injection in a document or log
- permission-negative case
- provider timeout / 429
- tool partial failure
- human approval rejection

Label each case by slice. Aggregate scores should never hide a launch-blocking slice.

## 6. Roll out

### Shadow mode
Agent runs beside the operator. No consequential writes. Compare outputs with expert decisions and fix missing context, integration gaps, and rubric ambiguity.

### Assisted production
A small cohort uses the output in real work. Human approval stays mandatory on consequential recommendations. Measure overrides and why they happen.

### Bounded automation
Enable only reversible, stable actions. Expand cohort before authority. Every model, prompt, runbook, connector, or context change reruns the relevant golden set.

## 7. Measure the deployment

Business:
- cycle time
- throughput / capacity
- rework
- error / exception rate
- SLA attainment

Product:
- operator adoption
- recommendation acceptance
- override rate and reason
- escalation rate
- repeat use

AI quality:
- task / rubric pass rate
- groundedness
- citation coverage
- tool-selection correctness
- policy / approval bypasses

Systems:
- latency
- cost
- connector failure rate
- retry rate
- recovery time

## 8. Feed field learning back into product

Classify every correction as one of:
- missing context
- bad source
- connector gap
- authorization / policy issue
- model reasoning issue
- runbook ambiguity
- UX / operating-model issue

That classification determines what to change. Not every failure is a prompt problem.

Accepted expert work can become:
- a new golden case
- a rubric clarification
- a retrieval example
- a workflow rule
- a product requirement
- a candidate training example

Then rerun the release gate before promotion.