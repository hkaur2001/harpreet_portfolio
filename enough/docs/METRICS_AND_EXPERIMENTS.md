# Enough — Metrics and Experiments

## Measurement philosophy

Enough should be measured against the real-world job: **helping a group turn a tentative idea into an actual shared plan with less coordination pressure.**

Vanity metrics such as page views, total RSVPs, or time spent in the app are not enough. A product can generate a lot of taps while failing to create more in-person time.

## North-star candidate

### Confirmed plans that actually happen
The best long-term north star is the number of plans that reach quorum **and** are later reported as having happened.

That requires a lightweight post-event check in a later version, so the private-beta proxy is:

### Confirmed plans per active group / creator
This measures whether the core threshold mechanic produces plans that become real.

## Metric tree

### Acquisition
- plan-link opens by source;
- new participants per plan;
- share-link copy/share rate;
- percentage of participants who later create a plan.

### Activation
Host activation:
- created first plan;
- shared link;
- received at least two non-host responses.

Participant activation:
- opened plan;
- submitted an RSVP within one session.

### Core outcome
- **quorum conversion rate** = confirmed plans / plans with at least one external response;
- median time from creation to quorum;
- median time from first external response to quorum;
- percentage of plans that expire without confirmation;
- distribution of thresholds chosen.

### Coordination efficiency
- median invitation → response time;
- responses per link open;
- host actions required after creation;
- confirmed plans that require host intervention before event time.

### Retention
- creators who create another plan within 30 days;
- participants who create their first plan within 30 days;
- groups with 2+ confirmed plans in 60 days.

### Quality / trust guardrails
- cancellation rate after quorum;
- percentage of confirmed participants who later report not attending;
- notification unsubscribe / complaint rate;
- abuse or unwanted-link reports;
- support/error rate per 100 plans;
- duplicate-response or identity-confusion incidents.

### Reliability
- RSVP endpoint p50/p95/p99 latency;
- threshold transaction error rate;
- notification delivery success rate;
- stale/open plan rate after deadline;
- confirmation transitions emitted more than once: target **zero**.

## Event instrumentation

Suggested product events:

```text
plan_create_started
plan_created
plan_shared
plan_opened
rsvp_submitted
rsvp_changed
quorum_reached
plan_expired
plan_cancelled
calendar_added
unlock_notification_attempted
unlock_notification_delivered
post_event_check_answered
```

Each event should include only the minimum metadata needed for product analysis: plan ID, anonymous participant/session ID, threshold bucket, time horizon, source surface, and timestamps. Do not include email addresses or response identities in analytics payloads.

## Experiment 1 — Blind quorum vs visible guest list

### Question
Does hiding identities before confirmation reduce social-pressure effects enough to improve participation or decision speed?

### Control
Aggregate count plus names of people who already said yes.

### Treatment
Aggregate count only until quorum; reveal yes participants after confirmation.

### Primary metrics
- RSVP completion rate;
- median invitation → response time;
- quorum conversion rate.

### Guardrails
- participant confusion rate;
- “who is going?” support/feedback mentions;
- cancellation-after-unlock rate.

### Decision rule
Do not ship blind quorum as dogma. Keep it if the treatment improves at least one core outcome without materially harming trust or clarity. Qualitative feedback should be reviewed alongside the numbers.

## Experiment 2 — Host pledge hidden vs disclosed

### Question
Does showing “host is already in” create useful confidence or undesirable anchoring?

Variants:
- A: host pledge counts but is hidden until confirmation;
- B: host pledge shown as a named yes;
- C: host does not count toward threshold unless they explicitly RSVP after sharing.

Measure quorum rate and response timing, but also ask whether participants felt free to decline.

## Experiment 3 — Threshold framing

Test language, not the mathematical rule:

- “Unlock at 4 people”
- “Needs 4 yeses to happen”
- “If 4 people are in, it’s on”

Primary metric: comprehension in usability tests, then RSVP completion in beta.

## Experiment 4 — Default RSVP deadline

For spontaneous plans, a long deadline can turn the product back into a slow group chat. Test defaults based on event horizon:

- Tonight → close 90 minutes before start
- Tomorrow → close 4 hours before start
- Weekend → close the prior evening

Measure quorum timing and last-minute expiration.

## Qualitative learning loop

After confirmed plans, ask two optional questions:

1. **Did this plan actually happen?** Yes / No
2. **Would this plan probably have happened without Enough?** Yes / Maybe / No

The second question is imperfect self-reporting, but it helps separate plans that merely passed through the app from plans where the mechanism created incremental value.

## Private-beta success criteria

Before broader launch, look for evidence that:

- at least 60% of invited link-openers submit a response;
- median RSVP completion takes under one minute;
- at least 40% of plans with two external responses reach quorum;
- at least 70% of confirmed plans are reported as actually happening;
- at least 30% of creators make a second plan within 30 days;
- no privacy incidents reveal pre-quorum identities;
- no duplicate quorum-transition incidents occur.

These numbers are **proposed beta gates**, not current measured results. They should be revised once real usage data exists.

## What not to optimize

Do not optimize for:
- time spent in the app;
- number of plans created regardless of outcome;
- friend ranking or “most social” leaderboards;
- notifications sent;
- public sharing virality at the expense of private-group trust.

The product should disappear into the background once it has done its job.
