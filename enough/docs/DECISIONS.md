# Enough — Product and Architecture Decisions

This log captures choices that materially shape the product. The point is not to pretend every choice is permanent; it is to make the tradeoffs explicit enough that future evidence can overturn them.

## D-001 — Use blind quorum before confirmation

**Decision:** show the aggregate yes count while a plan is open, but hide participant identities and the host’s pledge.

**Why:** the product is testing whether independent commitment can be separated from “who else is going?” social proof.

**Risk:** names may be exactly the information some people need before deciding.

**How we will test it:** visible-name vs blind-quorum experiment plus interviews about trust and decision comfort.

## D-002 — Reveal yes participants after quorum

**Decision:** anonymity is phase-based, not permanent.

**Why:** after confirmation, identities become useful for logistics, anticipation, and trust. The social-pressure problem we are targeting primarily exists before the decision is made.

**Alternative considered:** never reveal individual votes, similar to fully anonymous polling products.

## D-003 — Threshold automatically confirms the plan

**Decision:** no second host acceptance step.

**Why:** asking the host to manually approve after the threshold creates uncertainty about what the number means. The threshold should be a clear contract.

**Consequence:** hosts need a deliberate threshold and a cancel control. The product should explain that reaching quorum makes the plan real.

## D-004 — Keep the first-use flow link-first

**Decision:** no account is required to respond in the MVP.

**Implementation:** a high-entropy per-plan browser capability token identifies a participant’s response for update purposes. The server stores only its hash.

**Why:** installing an app or creating an account before answering a casual plan would add more friction than the group chat we are trying to beat.

**Risk:** clearing browser storage loses identity continuity; forwarded links are not access-controlled.

**Future option:** optional passkeys/email auth for hosts and recurring circles.

## D-005 — Server-only database access

**Decision:** the browser never receives a Supabase service-role credential and does not directly query response tables.

**Why:** pre-quorum identity hiding is a data-access rule, not merely a UI rule. If the browser could query all responses directly, a curious user could bypass the interface.

**Implementation:** RLS is enabled; anon/authenticated table privileges are revoked; Next.js server routes use the service role.

## D-006 — Atomic quorum in PostgreSQL

**Decision:** confirmation occurs inside a row-locking database function rather than in browser code or a read-then-write API sequence.

**Why:** two friends can RSVP at nearly the same moment. The database must serialize the transition so the plan confirms exactly once.

## D-007 — Do not use AI for the core decision

**Decision:** quorum is deterministic.

**Why:** “3 yeses out of 4 required” does not benefit from probabilistic reasoning. Using a language model for confirmation would make the most important state transition slower, more expensive, and less reliable.

**Where AI may help later:** venue suggestions, summarizing constraints, or generating candidate activities. Those are assistive features around the decision, not the authority deciding whether the plan is real.

## D-008 — No public feed or reliability score

**Decision:** do not turn social planning behavior into a public reputation system.

**Why:** a “flaky friend score” could increase the same social pressure the product is designed to reduce. Declines are local to a plan, not permanent profile data.

## D-009 — Email is optional and downstream

**Decision:** plan confirmation must not depend on notification delivery.

**Why:** a mail outage should not cause a successful threshold transaction to fail or repeat. The plan page and database remain the source of truth.

## D-010 — Start with one time, not a scheduling poll

**Decision:** v1 asks the proposer to suggest a concrete time.

**Why:** the initial product hypothesis is about turnout uncertainty. Multi-time voting would mix that with availability coordination and make it harder to tell which mechanism created value.

**Revisit when:** diary research shows otherwise-good ideas routinely fail because the proposed time is wrong.

## D-011 — Default to mobile-first web before native apps

**Decision:** ship as a responsive web application.

**Why:** a share link can be opened from any existing group chat without App Store friction. Web Share, calendar deep links, `.ics`, email, and eventually Web Push cover the most important first-version interactions.

**Native app trigger:** repeated usage demonstrates enough value to justify contact/calendar permissions, push reliability, widgets, or deeper platform integration.

## D-012 — A failed plan should fail quietly

**Decision:** if the deadline expires before quorum, the plan simply becomes “didn’t unlock this time.”

**Why:** the product should not turn insufficient turnout into a public rejection event or force the host to write a cancellation message.
