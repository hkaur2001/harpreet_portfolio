# Cleveland Clinic third-party risk — public-source FieldGuide reconstruction

## Why this case is in FieldGuide

This is a real-world enterprise workflow reconstructed from a public SecurityScorecard customer case study. It is included to demonstrate how a deployment strategist can start from documented operating facts, separate facts from assumptions, and turn the workflow into a testable agent deployment plan.

**Important:** Cleveland Clinic is not presented as a FieldGuide customer. The agent design below is a proposed deployment reconstruction.

Public source: https://securityscorecard.com/resources/case-studies/cleveland-clinic/

## Publicly documented workflow facts

According to the public SecurityScorecard case study:

- Cleveland Clinic uses SecurityScorecard in RFx activity.
- New vendors are risk-tiered / risk-stratified, with more attention spent on higher-risk third parties.
- Higher-risk third parties are continuously monitored and followed up when scores move outside the acceptable range.
- Cleveland Clinic implemented ServiceNow Vendor Risk Management and integrated risk management with SecurityScorecard.
- The integration created a one-stop view of third-party risk and reduced the time required to move through assessments.
- Teams outside cybersecurity can access third-party risk information.

Those points are the evidence base for this scenario. Everything below is a FieldGuide proposal.

## Proposed first AI deployment

**First wedge: cited vendor evidence assembly.**

Do not start by letting an agent autonomously approve or close high-risk assessments. Start with the reversible work that consumes analyst time and is easy to evaluate:

1. Read the active ServiceNow VRM case.
2. Enforce requester / resource / purpose authorization.
3. Read the current SecurityScorecard signal.
4. Collect the supporting evidence the analyst is authorized to see.
5. Build a cited evidence pack and draft a risk / follow-up recommendation.
6. Route material exceptions to a named human reviewer.
7. Write the approved disposition back to ServiceNow with evidence IDs and reviewer attribution.

## 3-minute portfolio demo

### Minute 1 — Discover

Select **Real-world case · Healthcare** in FieldGuide.

The UI immediately shows:
- the public source
- which statements are sourced
- which pieces are deployment assumptions
- the current system map
- the operator pain
- the deployment objective

### Minute 2 — Pilot

Open **Pilot** and run the high-risk score-deterioration scenario.

The trace makes the implementation legible:
- tool call
- deterministic authorization
- external risk evidence
- context retrieval
- model recommendation
- human approval
- approved writeback

Turn on fault injection to show that an interrupted run resumes from a checkpoint rather than silently repeating completed work.

### Minute 3 — Manage

Open **Manage**.

A deployment owner can see on one screen:
- business owner
- operator owner
- deployment perimeter
- first pilot
- whether the historical replay ran
- whether an expert accepted / corrected the output
- whether the golden-set hard controls pass
- current rollout stage
- the next best action

This is the point of FieldGuide: the underlying system can include models, tools, authorization, durable execution, and evaluation without forcing the business owner to manage those implementation details directly.

## Management sequence

FieldGuide uses three explicit stages:

**Shadow mode**
- Run beside human experts.
- No consequential autonomous writes.
- Capture accepted and corrected outputs.
- Turn corrections into golden cases / rubric updates.

**Assisted production**
- Deploy to a small operator cohort.
- Keep consequential decisions human-reviewed.
- Measure acceptance, overrides, cycle time, cost, and latency.

**Bounded automation**
- Enable only stable, reversible actions.
- Expand cohort before expanding authority.
- Rerun regression gates after every model, prompt, connector, context, or runbook change.

## Why this is a strong deployment-strategy example

The case forces the project to handle the parts that enterprise AI demos often skip:

- an existing system of record remains authoritative
- an external risk signal is useful but not itself an approval decision
- business speed and cyber risk have to be balanced
- high-risk exceptions remain attributable to people
- field corrections become evaluation data
- the rollout is sequenced instead of launched as a big-bang autonomous agent

That is the deployment-strategist job: choose the right wedge, translate the workflow into a governed system, prove value, and expand authority only after the evidence supports it.