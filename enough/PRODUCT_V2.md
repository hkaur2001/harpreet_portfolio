# Enough v2 — Product definition

## Product thesis

Enough is not an RSVP poll. It is a **conditional coordination engine** for casual social plans.

A normal poll answers: “Which option got the most votes?”

Enough answers: **“Is there one executable version of this idea that at least N people can genuinely attend?”**

The product should only turn an idea into a confirmed event when a compatible quorum exists across the important constraints.

## User problem

Adult friend groups repeatedly lose plans in four places:

1. **Conditional interest:** “I want to do this, but only if enough people are actually coming.”
2. **False consensus:** four people may say yes while meaning four incompatible times or neighborhoods.
3. **Diffusion of responsibility:** the plan unlocks and everyone assumes somebody else will reserve/book/bring the thing.
4. **Day-of coordination:** the group chat becomes a stream of “where are you?”, “running late”, and “what was the address again?”

Enough owns the whole lifecycle from tentative idea to executable plan to day-of coordination.

## Core mechanic: compatible quorum

The host supplies:
- the idea
- 1–4 possible times
- 0–4 possible places
- minimum viable group size
- deadline
- optional post-unlock owner task

Each friend privately supplies:
- yes/no intent
- every time they can genuinely make
- every place they would genuinely go

Enough evaluates every time × place combination. A plan confirms only when one combination has at least the threshold number of compatible people.

### Example

Threshold: 4

- 5 people say they are interested.
- Friday 7 PM / East Village has 3 compatible people.
- Friday 8:30 PM / East Village has 4 compatible people.

Enough confirms **Friday 8:30 PM / East Village**. It does not say “5/4 yes” before a viable group exists.

## Privacy model

Before confirmation:
- participant names are not revealed
- individual time/place constraints are not revealed
- only aggregate progress is shown

After confirmation:
- only people compatible with the winning combination appear in the confirmed guest list
- emails, no-votes, and losing-option preferences remain private
- day-of statuses become visible to the confirmed group

## Post-confirmation coordination hub

The product changes jobs after quorum.

It now provides:
- exact locked time and place
- confirmed guest list
- Google Calendar handoff
- downloadable ICS
- map/directions handoff
- an explicit host-owned task such as “book the table” or “buy tickets”
- a day-of pulse: on my way / on time / 10 min late / 20+ late / can’t make it

This prevents the user from solving quorum in Enough and then immediately returning to the group chat for every logistical detail.

## Product principles

1. **An idea is not an event yet.** Keep proposing cheap until compatible quorum exists.
2. **Count executable overlap, not enthusiasm.** “Yes” without a common time/place is not a plan.
3. **Hide social proof while commitment is forming.** Reveal identities only after the decision is locked.
4. **Remove coordinator work after confirmation too.** The product is not finished at RSVP.
5. **Deterministic confirmation.** A social commitment rule must be inspectable, predictable, and concurrency-safe.
6. **No mandatory social graph.** A link should be enough to participate.

## Metrics

North-star candidate: **confirmed plans that actually happen**.

Leading indicators:
- idea → first external commitment
- compatible-quorum conversion
- median time to compatible quorum
- interested-count vs best-fit-count gap
- confirmed-plan → calendar action
- host-task completion
- day-of pulse usage
- cancellation after confirmation
- participant → creator conversion
- second plan created within 30 days

## Experiment backlog

### Blind vs visible fit
Hypothesis: hiding identities before confirmation increases honest participation without materially increasing confusion.

### Single option vs compatibility envelope
Hypothesis: 2–3 candidate times/places materially increases compatible-quorum conversion without making creation feel like work.

### Owner task
Hypothesis: an explicit “if this unlocks, I’ll…” field reduces confirmed plans that stall because nobody books or prepares.

### Day-of pulse
Hypothesis: one-tap status reduces group-chat coordination messages and increases confidence that the plan is still happening.

## Explicit non-goals for v2

- public discovery feed
- follower counts / popularity metrics
- reliability scores for friends
- open-ended event chat
- AI deciding whether a plan is confirmed
- complex recurring-event management
- ticketing/payments

The product should earn those surfaces through evidence instead of becoming a generic event platform.
