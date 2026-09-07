# Enough — Launch and Roadmap

## Launch strategy

Enough should not launch by trying to acquire individual users in isolation. The useful unit is a **real friend group with an existing communication channel**. The private beta should therefore recruit groups, not anonymous traffic.

## Phase 0 — Founder / friend beta

### Goal
Prove the end-to-end loop with 5–10 real friend groups before adding more features.

### Scope
- one-link plan creation;
- tonight/tomorrow/weekend presets;
- minimum headcount;
- blind pre-quorum RSVPs;
- automatic confirmation;
- post-quorum guest-list reveal;
- link sharing;
- calendar export;
- optional unlock email.

### What to observe
- Do people understand “I’m in if it happens” without explanation?
- Do hosts choose realistic thresholds?
- Does the plan feel awkward when it expires?
- Do participants repeatedly ask who else is in before quorum?
- Are friends comfortable entering names without an account?
- Do people trust the reveal behavior?

### Launch process
1. Recruit 5–10 groups with 4–12 people each.
2. Give each group one real use case rather than asking them to “test the app.”
3. Observe the first plan in person or over screen-share when possible.
4. Capture confusion and drop-offs before adding new features.
5. Run a two-week diary period.
6. Review metrics and qualitative themes together.

## Phase 1 — Private beta hardening

Ship only after the core loop is reliable across devices.

Priorities:
- production Supabase persistence;
- privacy regression tests;
- atomic quorum transaction tests;
- email delivery + retry logging;
- Web Push if opt-in rates justify it;
- basic abuse controls and rate limiting;
- analytics event schema;
- post-event “did it happen?” check;
- accessibility and mobile QA.

## Phase 2 — Reduce time coordination without becoming a calendar app

The first extension should attack the next most common failure after turnout uncertainty.

Potential feature: **two candidate windows**
- host can offer “Friday 7:30” or “Saturday 4:00”;
- each option has its own quorum;
- first option to reach quorum wins, or host sets a rule when both qualify.

This should only ship if user research shows time uncertainty is blocking otherwise valuable threshold plans.

## Phase 3 — Private circles, not a public social graph

If groups repeatedly use Enough, save the recurring invite set as a lightweight private circle:
- “Princeton friends”
- “work crew”
- “running group”

A circle is a convenience layer for sharing, not a feed or public profile network.

## Phase 4 — Calendar intelligence

Optional integrations:
- Google Calendar free/busy hints;
- Apple/ICS calendar export/import patterns;
- Outlook calendar availability.

Privacy principle: default to **availability**, not event titles. Enough should not need to ingest a friend’s full calendar content simply to suggest whether a time is plausible.

## Phase 5 — Recommendations as an assistive layer

Only after the commitment loop is validated:
- location suggestions based on neighborhood constraints;
- “something low-key under $40” recommendations;
- weather-aware outdoor alternatives;
- transit-aware midpoint suggestions.

AI can be useful here, but recommendation generation should never control quorum or participant identity rules.

## Notifications roadmap

### v1
- optional email on unlock.

### v1.1
- browser Web Push after explicit opt-in.

### later
- SMS only if user demand justifies the cost and phone-number/privacy burden.

Avoid aggressive reminder loops. One reason Enough exists is to reduce social-pressure overhead, not automate nagging.

## Growth loops

The natural growth loop is product-mediated:

```text
host creates a plan
        ↓
shares link in existing group chat
        ↓
friends RSVP without account creation
        ↓
plan confirms
        ↓
participants experience the reveal
        ↓
participant creates next plan
```

The key referral metric is therefore **participant → creator conversion**, not generic invite volume.

## Monetization hypothesis

Do not monetize before repeat behavior exists.

Potential future models:
- free core product;
- paid power-user/circle features such as richer calendar integration, recurring groups, or trip-scale coordination;
- venue partnerships only if recommendations remain transparent and do not distort the product’s primary decision.

Ads inside private friend plans would likely damage trust and are not an early recommendation.

## Major risks

### Risk: the threshold mechanic is too niche
Mitigation: measure the share of real social plans where turnout uncertainty is actually the primary blocker.

### Risk: permanent anonymity is what users really want
Mitigation: test phase-based reveal against never-reveal and always-visible variants.

### Risk: people want calendar coordination more than quorum
Mitigation: do not add calendar complexity until discovery data shows where plans fail.

### Risk: link-only identity feels too loose
Mitigation: private beta first; later offer optional passkeys/email authentication for hosts and recurring circles without forcing signup for first-time guests.

### Risk: plan links are forwarded beyond intended group
Mitigation: add optional invite code / host-approved group mode if beta groups encounter this problem. Do not solve it preemptively at the cost of first-use friction.

## What would make me stop building this

- Most failed plans in interviews are about finding a common time, not turnout uncertainty.
- Blindness meaningfully reduces trust or increases cancellations after reveal.
- Groups prefer existing poll tools once a threshold is added manually.
- Repeat creation is weak even among groups that successfully confirm a plan.

A strong PM process includes a stopping rule. The goal is not to defend the idea indefinitely; it is to find whether the behavior deserves a product.
