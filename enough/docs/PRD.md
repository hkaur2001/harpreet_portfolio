# Enough — Product Requirements Document

## Product
**Enough** — plans that unlock when enough people are in.

## Objective
Ship a web product that allows a person to propose a casual plan, define a minimum headcount, share one link, collect private conditional commitments, and automatically turn the idea into a confirmed plan when the threshold is reached.

## User stories

### Host
- As a host, I can create a plan without needing to create a permanent group.
- I can choose a date/time, location, RSVP deadline, and minimum headcount.
- I can decide whether my own attendance counts toward the threshold.
- I can share one link through the native share sheet or clipboard.
- I can see the aggregate yes count while the plan is open.
- I cannot see who said yes before quorum.
- When quorum is reached, I see the confirmed guest list automatically.
- I can cancel the plan from the device that created it.

### Participant
- I can open the shared link without first creating an account.
- I can see what is being proposed, when, where, the deadline, and the number of yeses required.
- I can respond **I’m in if it happens** or **Not this one**.
- I can change my response before confirmation.
- My identity is not exposed to the group before confirmation.
- If quorum is reached, I can see the confirmed guest list.
- I can add a confirmed plan to Google Calendar or download an `.ics` event.
- If I provide an email and notifications are enabled, I receive an unlock notification.

## Primary flow

### Create
1. Host enters plan idea and optional context/location.
2. Host chooses Tonight / Tomorrow / This weekend or a custom time.
3. Host sets RSVP deadline.
4. Host sets threshold between 2 and 30.
5. Host enters name; email is optional.
6. Host decides whether they are personally “in if it happens.”
7. Server validates the timing and threshold.
8. Plan is persisted and host capability token is stored only in that browser.
9. Host lands on the shareable plan page.

### RSVP
1. Participant opens share link.
2. Browser receives a local anonymous capability token for that plan.
3. Participant enters display name and optional email.
4. Participant chooses yes or no.
5. Server upserts one response per participant capability.
6. Database transaction counts current yes responses while holding a lock on the plan.
7. If count < threshold, plan stays open and only aggregate count is returned.
8. If count >= threshold, transaction atomically marks plan confirmed.
9. Confirmed response reveals guest list.
10. Notification delivery is triggered asynchronously and does not gate confirmation.

## Functional requirements

### FR-1: Creation validation
- Title: 3–90 characters.
- Threshold: integer 2–30.
- Deadline must be in the future.
- Start must occur after the deadline.
- v1 plan horizon <= 60 days.
- Description and location are optional but bounded.

### FR-2: Blind quorum privacy
For `status=open`:
- API may return aggregate yes count.
- API must not return response names or emails.
- API must not reveal whether the host pledged yes.
- Participants may see their own current response using their capability token.

For `status=confirmed`:
- API returns names of yes participants.
- emails remain server-private.
- no response history or individual no votes are exposed.

### FR-3: Atomic confirmation
Confirmation must be concurrency-safe. If several friends submit at nearly the same moment, the system must not create conflicting plan states or multiple separate confirmation transitions.

Implementation requirement: PostgreSQL function locks the plan row, upserts the RSVP, counts yes responses, and updates `open → confirmed` inside one transaction.

### FR-4: No manual acceptance step
The host cannot hold a threshold-met plan in limbo. If the threshold is the rule, reaching it confirms the plan automatically.

### FR-5: Expiration
An open plan whose deadline passes becomes `expired`. Expired plans reject new RSVPs.

### FR-6: Host control
Host cancellation requires a high-entropy browser-held secret. Only a hash is stored in the database.

### FR-7: Sharing
Use Web Share API where available, with clipboard fallback. Shared URL must contain no secret credentials.

### FR-8: Calendar handoff
Confirmed plans support:
- Google Calendar deep link;
- standards-based `.ics` export.

### FR-9: Notifications
Optional v1 email notification:
- only yes participants with emails receive “plan unlocked” email;
- notification errors never roll back confirmation;
- no marketing email is sent as part of the RSVP flow.

## State machine

```text
              deadline
   ┌─────────────┐
   │             ▼
 OPEN ────────> EXPIRED
  │
  │ yes_count >= threshold
  ▼
CONFIRMED

OPEN ── host cancel ──> CANCELLED
```

Confirmed plans do not return to open in v1.

## Edge cases

### Concurrent threshold crossing
Two RSVPs arrive when count is threshold - 1. The row-locking RPC serializes them. Only the first transition from open to confirmed reports `just_confirmed=true`.

### Participant double submits
Participant capability hash + plan ID is unique. Submitting again updates the same response instead of adding a new vote.

### Host submits after already being counted
The creation flow uses the same secret as the host participant capability, preventing the host from occupying two yes slots.

### Friend forwards a link
The forwarded recipient can participate. Enough v1 is private-by-link, not restricted to a predeclared invite list.

### Someone changes yes to no just before quorum
The most recent response is used. Once the plan has already confirmed, v1 freezes the quorum outcome; cancellation/attendance changes after confirmation belong in a later version.

### Deadline passes while page is open
Polling/read refresh transitions open plans to expired on the server. The UI also displays local countdown state.

### Email provider is down
Confirmation still succeeds. The page remains the source of truth; email is a convenience channel.

## Security and privacy requirements

- Supabase service-role key is server-only.
- Direct `anon` and `authenticated` table access is revoked.
- RLS is enabled as defense in depth.
- host secrets and participant tokens are hashed at rest.
- API responses never expose email addresses.
- no permanent reputation profile is created from decline/attendance behavior.
- plan URLs must not contain host/admin credentials.
- server errors returned to clients should not reveal database credentials or raw SQL.

## Accessibility requirements

- all form controls have labels;
- state is not communicated by color alone;
- interactive controls have visible focus states;
- layouts work on narrow mobile screens;
- touch targets should be at least ~44px for primary actions;
- critical text should retain readable contrast in both light and dark product surfaces.

## Performance targets

Initial private-beta targets:
- landing page LCP < 2.5s on typical mobile broadband;
- RSVP API p95 < 750ms excluding notification delivery;
- confirmation transaction p95 < 500ms under private-beta load;
- no synchronous email call should block RSVP response;
- page should remain usable if notification provider is unavailable.

## Non-goals

- public social feed;
- friend follower system;
- advanced calendar availability matching;
- payments, bookings, reservations;
- multi-option venue voting;
- AI-generated plan recommendations;
- attendance reliability scoring;
- full chat replacement.

## Definition of done for private beta

- creation works from mobile and desktop;
- share link opens on a separate device;
- identities remain hidden before quorum;
- threshold crossing confirms exactly once;
- guest list reveals after confirmation;
- calendar export works;
- expired/cancelled states reject RSVPs correctly;
- errors produce readable UI rather than raw stack/provider messages;
- production smoke test proves the complete threshold path against deployed infrastructure.
