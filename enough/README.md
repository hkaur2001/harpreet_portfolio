# Enough

**Plans that unlock when enough people are in.**

Enough is a link-first social planning product for casual plans that are only worth doing if enough friends join. A host throws out an idea, chooses a minimum headcount, and shares the link. Friends commit privately. Before the threshold is met, the group sees the aggregate count but not the identities behind it. The instant the threshold is reached, the plan becomes confirmed and the guest list is revealed.

The product is intentionally narrower than a calendar or event platform. It is built for the moment before an event exists: “I would do this, but only if enough of us are actually down.”

## Core loop

1. Create a lightweight plan for tonight, tomorrow, or the weekend.
2. Set the minimum number of people that makes it worth doing.
3. Share one link.
4. Friends answer **I’m in if it happens** or **Not this one**.
5. Until quorum, only the aggregate yes count is visible.
6. At quorum, confirmation is automatic, the guest list reveals, and the plan can be added to a calendar.
7. If the deadline passes first, the plan expires without requiring an awkward cancellation.

## Product wedge

Threshold-based plans already exist in several forms. Enough is not positioned as the first product to use a quorum. The differentiator is the combination of:

- **soft-hosting** — an idea is not presented as a formal event before it earns enough interest;
- **blind quorum** — identities and the host’s own pledge are hidden before confirmation;
- **automatic activation** — the host does not manually decide when the plan is “real”;
- **post-quorum reveal** — identities become useful only after the social-pressure phase is over;
- **short-horizon defaults** — designed around tonight, tomorrow, and this weekend;
- **link-first participation** — no public feed and no required social graph for the MVP.

## Technical architecture

### Public product

- Next.js 16 + React 19 + TypeScript
- server route handlers for creation, reads, RSVPs, host controls, and calendar export
- browser capability tokens for lightweight identity continuity
- Web Share API with clipboard fallback
- Google Calendar deep links and `.ics` export
- Vercel deployment

### Collaborative persistence

The production data layer is designed for Supabase/PostgreSQL:

- private `enough_plans` and `enough_responses` tables;
- service-role access only from server routes;
- hashed host and participant capability tokens;
- row-level security enabled and direct client table access revoked;
- a PostgreSQL transaction/RPC that locks the plan row, upserts an RSVP, counts yes responses, and confirms the plan atomically when quorum is reached.

See [`supabase/schema.sql`](./supabase/schema.sql).

### Notifications

Optional unlock emails are supported through Resend when `RESEND_API_KEY` and `RESEND_FROM` are configured. Notification delivery is deliberately downstream of the quorum transaction so a mail-provider failure cannot prevent a plan from confirming.

## Environment variables

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=              # optional
RESEND_FROM=                 # optional
```

Never expose the service-role key to browser code.

## Product documentation

- [`docs/PRODUCT_BRIEF.md`](./docs/PRODUCT_BRIEF.md)
- [`docs/RESEARCH_AND_COMPETITION.md`](./docs/RESEARCH_AND_COMPETITION.md)
- [`docs/PRD.md`](./docs/PRD.md)
- [`docs/METRICS_AND_EXPERIMENTS.md`](./docs/METRICS_AND_EXPERIMENTS.md)
- [`docs/LAUNCH_AND_ROADMAP.md`](./docs/LAUNCH_AND_ROADMAP.md)
- [`docs/DECISIONS.md`](./docs/DECISIONS.md)

## Trust and safety principles

Enough should reduce social pressure, not create a new popularity system. The MVP therefore does **not** include public profiles, follower counts, attendance reliability scores, friend rankings, read receipts, or public rejection histories. A response is scoped to a plan and is not turned into a permanent reputation score.

The application uses no AI in the quorum decision. Confirmation is deterministic: the plan is either open, confirmed, expired, or cancelled according to explicit rules.
