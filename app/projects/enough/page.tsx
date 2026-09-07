import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";

export const metadata = {
  title: "Enough — Product Strategy + Full-Stack Build",
  description: "An end-to-end product case study for a compatible-quorum social planning product that moves a group from tentative idea to executable plan to day-of coordination.",
};

const painPoints = [
  ["Conditional interest", "I would do this—but only if enough people are actually in."],
  ["False consensus", "Four people can all say yes while meaning four different times or neighborhoods."],
  ["Social pressure", "Early visible RSVPs change later responses: “who else is going?” becomes part of the decision."],
  ["Diffused ownership", "The plan becomes real and everybody assumes somebody else is booking the table or buying the tickets."],
  ["Day-of fragmentation", "The address, calendar link, late arrivals, and final guest list scatter back across the group chat."],
] as const;

const metrics = [
  ["North star", "Confirmed plans that actually happen", "The outcome lives offline, so the product ultimately has to create real shared time—not clicks."],
  ["Core", "Compatible-quorum conversion", "What share of tentative ideas produce one time/place combination with enough people?"],
  ["Speed", "Median time to compatible quorum", "Does the product reduce coordination latency?"],
  ["Diagnostic", "Interested count − best-fit count", "Are plans failing because nobody wants them, or because schedules do not overlap?"],
  ["Execution", "Host-task completion", "Did the reservation/tickets/bring-item responsibility actually get handled?"],
  ["Guardrail", "Cancellation after confirmation", "Are people committing too casually before the reveal?"],
  ["Retention", "Second plan within 30 days", "Was this useful enough for somebody to create another plan?"],
] as const;

const experiments = [
  {
    question: "Does hiding identities improve commitment quality?",
    treatment: "Show only compatible-group progress before confirmation; reveal names after the plan locks.",
    control: "Show names alongside commitments from the first response.",
    judge: "Response rate, time to response, compatible-quorum conversion, confusion, and cancellation after reveal.",
  },
  {
    question: "Does a small compatibility envelope beat one fixed option?",
    treatment: "Host supplies 2–3 plausible times/places and friends select every feasible version.",
    control: "Host supplies one fixed time/place with yes/no RSVP.",
    judge: "Quorum conversion versus creation time and invitee completion time.",
  },
  {
    question: "Does explicit ownership keep confirmed plans from stalling?",
    treatment: "Host declares one 'if this unlocks, I’ll…' task before sharing.",
    control: "No explicit post-confirmation responsibility.",
    judge: "Reservation/task completion, post-confirmation cancellation, and organizer follow-up messages.",
  },
  {
    question: "Can one-tap arrival status replace day-of logistics spam?",
    treatment: "Confirmed guests can mark on my way / on time / late / can’t make it on the plan card.",
    control: "Calendar + address only.",
    judge: "Pulse use, day-of group-chat messages, and participant confidence that the plan is still happening.",
  },
] as const;

export default function EnoughProjectPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · product management · consumer product · full-stack build</p>
          <h1 className="mt-5 max-w-6xl text-balance text-5xl font-semibold tracking-[-0.055em] md:text-7xl">Enough: don’t vote on a plan. Find one enough people can actually make.</h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-[var(--muted)]">I started with a recurring adult-friend problem: an idea sounds fun, but it is only worth organizing if a real group can make it. A yes/no poll is not enough because interest, availability, location, execution, and day-of coordination are different failure modes. I designed Enough around the whole lifecycle.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/enough" className="btn-primary rounded-full px-5">Use the product →</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/enough" target="_blank" rel="noreferrer" className="btn-secondary">PRD + architecture ↗</a></div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">PROBLEM</p><h2 className="mt-3 text-xl font-semibold">“Enough people are interested” is not the same as “enough people can attend the same plan.”</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">The product has to distinguish enthusiasm from executable overlap.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">PRODUCT WEDGE</p><h2 className="mt-3 text-xl font-semibold">Compatible quorum with private constraints.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Friends mark every time/place they can genuinely make. Enough confirms only a combination that clears the threshold.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">AFTER THE DECISION</p><h2 className="mt-3 text-xl font-semibold">The RSVP surface becomes a coordination hub.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Exact plan, confirmed group, calendar, maps, task ownership, and day-of pulse stay attached to one canonical card.</p></article>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Throw out an idea", body: "The host proposes something casual and supplies a small set of plausible times and places." },
              { title: "Set the commitment rule", body: "The host chooses the minimum group size and deadline before anybody responds." },
              { title: "Collect private feasible sets", body: "Each friend selects every time and place they would genuinely accept—not one favorite." },
              { title: "Solve for compatible quorum", body: "The system evaluates time × place combinations and tracks the largest executable group." },
              { title: "Confirm one combination atomically", body: "When a combination reaches the threshold, PostgreSQL locks the plan and records the winning time/place exactly once." },
              { title: "Switch product modes", body: "After confirmation, Enough reveals the compatible group and becomes the day-of plan card instead of remaining an RSVP screen." },
            ]}
            toolGroups={[
              { label: "Product management", items: ["Problem framing", "JTBD", "Assumption mapping", "Competitive research", "PRD", "MVP scoping", "Metric tree", "Experiment design", "Roadmap", "Launch gates"] },
              { label: "Application", items: ["Next.js 16", "React 19", "TypeScript", "Web Share API", "Google Calendar", "ICS", "Google Maps", "Responsive UI"] },
              { label: "Production design", items: ["PostgreSQL", "Supabase", "RLS", "Transactional RPC", "Hashed capability tokens", "Concurrency control", "Vercel", "CI + stress tests"] },
            ]}
            note="The confirmation rule is deterministic rather than AI-driven. This is a social commitment boundary: predictability and auditability are more valuable than model flexibility."
          />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">01 · Problem discovery</p>
          <div className="mt-4 grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div><h2 className="text-4xl font-semibold tracking-[-0.045em]">The useful unit of analysis was the planning lifecycle—not the RSVP button.</h2><p className="mt-5 text-sm leading-7 text-[var(--muted)]">I decomposed the job into places where a casual plan dies. The key product change came from recognizing that “people want this” and “there is one plan enough people can execute” are separate states.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{painPoints.map(([title, body], index) => <article key={title} className={`rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 ${index === painPoints.length - 1 ? "sm:col-span-2" : ""}`}><p className="font-mono text-xs text-[var(--signal)]">0{index + 1}</p><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p></article>)}</div>
          </div>
          <div className="mt-10 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Research discipline</p><p className="mt-3 max-w-4xl text-sm leading-7">These are product hypotheses derived from the problem and category research—not fabricated interview findings. A private beta should test frequency, severity, current workarounds, willingness to share a new link, and whether users understand the privacy/confirmation mechanic without explanation.</p></div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">02 · Category research</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.045em]">The product is intentionally narrower than an event platform or shared calendar.</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><div className="flex items-center justify-between gap-4"><h3 className="text-xl font-semibold">Partiful</h3><a href="https://partiful.com" target="_blank" rel="noreferrer" className="text-xs font-semibold underline">Official site ↗</a></div><p className="mt-4 text-sm leading-7 text-[var(--muted)]">Strong once an event exists: invitations, RSVPs, event pages, guest management, communication, and time-finding tools. Enough starts one step earlier with the conditional question: is there an executable version worth turning into an event at all?</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><div className="flex items-center justify-between gap-4"><h3 className="text-xl font-semibold">Howbout</h3><a href="https://howbout.app" target="_blank" rel="noreferrer" className="text-xs font-semibold underline">Official site ↗</a></div><p className="mt-4 text-sm leading-7 text-[var(--muted)]">Strong at shared calendars, availability, groups, and schedule coordination. Enough does not require a shared calendar or social graph; it asks invitees for a bounded feasible set for one casual idea, then combines availability with a minimum-commitment rule.</p></article>
          </div>
          <div className="mt-6 rounded-3xl bg-[var(--ink)] p-7 text-white"><p className="font-mono text-xs uppercase tracking-[0.14em] text-white/55">Differentiation hypothesis</p><p className="mt-4 max-w-4xl text-xl leading-8">Enough’s wedge is <strong>compatible quorum + blind pre-confirmation constraints + post-lock coordination</strong>. That is a hypothesis to validate with usage and retention—not a claim that no adjacent product has ever implemented a threshold or scheduling poll.</p></div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">03 · Product definition</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><h3 className="text-lg font-semibold">Job to be Done</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]">When I have an idea I would enjoy with friends but only want to organize if a real group can make it, help us discover one executable version without turning me into the coordinator of a plan that may never happen.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><h3 className="text-lg font-semibold">Product principle</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]"><strong className="text-[var(--ink)]">Count executable overlap, not enthusiasm.</strong> Five “yes” responses do not matter if the best shared time/place only works for three people.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><h3 className="text-lg font-semibold">MVP boundary</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]">Link-first participation, 1–4 times, 0–4 places, threshold, deadline, one owner task, calendar/maps, and pulse. No feed, follower graph, chat clone, reputation score, ticketing, or AI confirmation.</p></article>
          </div>

          <div className="mt-10 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">State machine</p>
            <div className="mt-6 grid gap-3 md:grid-cols-4">{[
              ["IDEA", "Cheap to propose. Host defines a compatibility envelope."],
              ["OPEN", "Invitees privately submit feasible sets. Aggregate best fit updates."],
              ["CONFIRMED", "One combination crosses threshold; compatible guest list reveals."],
              ["DAY-OF", "The card carries ownership, directions, calendar, and arrival status."],
            ].map(([state, body], index) => <div key={state} className="relative rounded-2xl bg-[var(--bg)] p-5"><p className="font-mono text-xs text-[var(--signal)]">0{index + 1} · {state}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">04 · The decision engine</p>
          <div className="mt-4 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div><h2 className="text-4xl font-semibold tracking-[-0.045em]">A plan confirms only when a single combination clears the threshold.</h2><p className="mt-5 text-sm leading-7 text-[var(--muted)]">The host might offer Friday 7:00, Friday 8:30, East Village, and LES. Each yes response is a feasible set. Enough evaluates the Cartesian product of allowed times and places, then counts how many people belong to each combination.</p></div>
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6 font-mono text-sm leading-7"><p>threshold = 4</p><p className="mt-3 text-[var(--muted)]">5 people are interested</p><p>Fri 7:00 × East Village → 3</p><p>Fri 7:00 × LES → 2</p><p className="rounded-lg bg-[var(--surface)] px-2">Fri 8:30 × East Village → <strong>4 ✓ CONFIRM</strong></p><p>Fri 8:30 × LES → 3</p><p className="mt-4 text-[var(--muted)]">Result: Friday 8:30 / East Village, with only those 4 compatible people on the confirmed guest list.</p></div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">05 · Engineer the social contract</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.045em]">Privacy and confirmation live in the data layer, not in CSS.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">BEFORE</p><h3 className="mt-3 font-semibold">Raw responses stay server-side.</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">The browser receives aggregate fit progress and the viewer’s own response—not everybody else’s names or constraints. RLS and revoked client table access enforce the boundary.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">AT THRESHOLD</p><h3 className="mt-3 font-semibold">The database owns the transition.</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">A PostgreSQL transaction locks the plan, recomputes the best combination, and records the winning option once. Concurrent final RSVPs cannot create conflicting confirmations.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">AFTER</p><h3 className="mt-3 font-semibold">Reveal only what became operationally useful.</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Confirmed compatible names and day-of pulse appear; no-votes, emails, and losing-option preferences remain private.</p></article>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">06 · Metrics</p>
          <div className="mt-4 grid gap-10 lg:grid-cols-[0.7fr_1.3fr]"><div><h2 className="text-4xl font-semibold tracking-[-0.045em]">The north star cannot be “RSVPs submitted.”</h2><p className="mt-5 text-sm leading-7 text-[var(--muted)]">The product earns its keep only if tentative ideas turn into real-world time together. Leading metrics diagnose whether Enough improves commitment, compatibility, and execution on the way there.</p></div><div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg)]">{metrics.map(([kind, metric, why]) => <div key={metric} className="grid gap-2 border-b border-[var(--line)] px-5 py-5 last:border-0 md:grid-cols-[0.55fr_0.9fr_1.55fr]"><span className="font-mono text-[11px] uppercase text-[var(--signal)]">{kind}</span><strong className="text-sm">{metric}</strong><p className="text-sm leading-6 text-[var(--muted)]">{why}</p></div>)}</div></div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">07 · Experiment before expanding</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.045em]">Every distinctive mechanic is still an assumption until users prove it.</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">{experiments.map((item) => <article key={item.question} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><h3 className="text-lg font-semibold">{item.question}</h3><div className="mt-5 grid gap-3 text-sm leading-6"><p><strong>Treatment:</strong> <span className="text-[var(--muted)]">{item.treatment}</span></p><p><strong>Control:</strong> <span className="text-[var(--muted)]">{item.control}</span></p><p className="border-t border-[var(--line)] pt-3"><strong>Judge it on:</strong> <span className="text-[var(--muted)]">{item.judge}</span></p></div></article>)}</div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">08 · Roadmap</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3"><article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><p className="font-mono text-xs text-[var(--signal)]">NOW</p><h3 className="mt-3 text-lg font-semibold">Prove compatible quorum</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Link-first creation, private feasible sets, automatic confirmation, ownership, calendar/maps, and day-of pulse.</p></article><article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><p className="font-mono text-xs text-[var(--signal)]">NEXT — ONLY IF EARNED</p><h3 className="mt-3 text-lg font-semibold">Near-miss recovery</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">If enough people are interested but no combination reaches quorum, surface the closest fit and let the host reopen a narrower version rather than starting from scratch.</p></article><article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><p className="font-mono text-xs text-[var(--signal)]">LATER — ONLY IF EARNED</p><h3 className="mt-3 text-lg font-semibold">Deeper constraints</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Budget, travel radius, reservations, weather, and venue discovery only become product surfaces if beta data shows they are frequent blockers.</p></article></div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-[2rem] bg-[var(--ink)] px-7 py-10 text-white md:px-10 md:py-12"><p className="font-mono text-xs uppercase tracking-[0.14em] text-white/55">What this project demonstrates</p><div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]"><h2 className="text-4xl font-semibold tracking-[-0.045em]">Product management is deciding what behavior the system should create—and then being able to ship and measure it.</h2><div className="text-sm leading-7 text-white/70"><p>I framed the problem, mapped the category, separated hypotheses from evidence, designed the MVP and state machine, defined metrics and experiments, implemented the interaction and backend contract, added privacy/concurrency controls, and kept the roadmap conditional on what users actually do.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/enough" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 font-semibold text-black">Try Enough →</Link><Link href="/projects" className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 font-semibold text-white">All projects</Link></div></div></div></div>
        </div>
      </section>
    </main>
  );
}
