import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";

export const metadata = {
  title: "Enough — Product Strategy + Full-Stack Build",
  description: "An end-to-end product case study and working web app for blind, threshold-based social planning.",
};

const research = [
  { product: "Partiful", strong: "Rich event pages, invitations, RSVPs, guest management", gap: "Best once somebody has already decided to host a real event." },
  { product: "Howbout", strong: "Shared calendars, availability, polls, reminders", gap: "Optimizes for when people are free; Enough tests whether enough people actually want the plan." },
  { product: "InCirclo", strong: "Minimum headcount and automatic event activation", gap: "Circle-first and visible commitment; Enough is link-first with blind pre-quorum identities." },
  { product: "bail.out", strong: "Anonymous attendance polls and threshold status", gap: "Votes remain anonymous; Enough reveals the confirmed group only after social proof can no longer influence the threshold." },
];

const metricRows = [
  ["Core outcome", "Quorum conversion rate", "Do tentative ideas become confirmed plans?"],
  ["Speed", "Median time to quorum", "Does the product reduce coordination latency?"],
  ["Activation", "Share → external RSVP", "Can a first-time friend participate without setup friction?"],
  ["Retention", "Second plan within 30 days", "Was the mechanism useful enough to repeat?"],
  ["Reality check", "Confirmed plan actually happened", "Did software produce real-world time together?"],
  ["Guardrail", "Cancellation after unlock", "Are people committing too casually before reveal?"],
];

export default function EnoughProjectPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · product management · full-stack product</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] md:text-7xl">Enough: plans that become real only when enough people are in.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">I started with a familiar adult-friend problem: sometimes I want to suggest dinner, drinks, a beach day, or a last-minute outing—but I only want to organize it if enough friends are genuinely interested. Group chats are good at conversation and bad at answering that conditional question cleanly.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/enough" className="btn-primary rounded-full px-5">Use the app →</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/enough" target="_blank" rel="noreferrer" className="btn-secondary">Product docs + architecture ↗</a></div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">PROBLEM</p><h2 className="mt-3 text-xl font-semibold">The host doesn’t know whether the plan is worth organizing.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Public RSVPs also create “who else is going?” pressure, so early responses influence later ones.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">PRODUCT WEDGE</p><h2 className="mt-3 text-xl font-semibold">Blind quorum, then reveal.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Before quorum: only the count is visible. At the threshold: the plan auto-confirms and the yes guest list reveals.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">SHIPPED SURFACE</p><h2 className="mt-3 text-xl font-semibold">A link-first responsive web app.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Creation, private commitment, threshold activation, share links, host controls, calendar handoff, persistence architecture, and notification hooks.</p></article>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Throw out an idea", body: "The host suggests something concrete without declaring a fully committed event." },
              { title: "Set what ‘enough’ means", body: "The minimum headcount is chosen before anyone responds, so the rule cannot move with the result." },
              { title: "Collect private conditional commitments", body: "Friends answer whether they would go if the threshold is reached. The group sees progress, not identities." },
              { title: "Confirm atomically", body: "The database transaction counts yes responses and transitions the plan to confirmed exactly once when quorum is reached." },
              { title: "Reveal the useful information", body: "Once the decision is locked, the confirmed guest list becomes visible and calendar actions appear." },
              { title: "Measure whether it changed behavior", body: "The product metric is not clicks; it is whether more tentative ideas become real plans that actually happen." },
            ]}
            toolGroups={[
              { label: "Product management", items: ["JTBD", "User research plan", "Competitive analysis", "PRD", "MVP scoping", "Non-goals", "Metric tree", "Experiment design", "Roadmap", "Launch gates"] },
              { label: "Live application", items: ["Next.js 16", "React 19", "TypeScript", "Web Share API", "Calendar deep links", "ICS export", "Responsive UI"] },
              { label: "Production data layer", items: ["Supabase", "PostgreSQL", "RLS", "Transactional RPC", "Hashed capability tokens", "Resend notification hook", "Vercel"] },
            ]}
            note="The app is deliberately not AI-first. The core decision is deterministic because a social quorum should be auditable and predictable. The product work is deciding what behavior to build, what not to build, and how to know if it helped."
          />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">01 · Discover</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">The category already exists. That makes the product question harder—and better.</h2><p className="mt-5 text-sm leading-7 text-[var(--muted)]">Research found event tools, shared calendars, threshold planners, and anonymous RSVP products. That ruled out the lazy claim that “minimum attendance is new.” The sharper hypothesis became the timing of identity: hide social proof while commitment is forming, then reveal it once the group has already crossed the threshold.</p></div>
            <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]"><div className="grid grid-cols-[0.55fr_0.85fr_1.1fr] border-b border-[var(--line)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"><span>Product</span><span>Strong at</span><span>Enough’s question</span></div>{research.map((item) => <div key={item.product} className="grid gap-2 border-b border-[var(--line)] px-5 py-5 last:border-0 md:grid-cols-[0.55fr_0.85fr_1.1fr]"><strong>{item.product}</strong><p className="text-sm leading-6 text-[var(--muted)]">{item.strong}</p><p className="text-sm leading-6">{item.gap}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">02 · Define</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><h3 className="text-lg font-semibold">Job to be Done</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]">When I have an idea I would enjoy with friends, but it is only worth the effort if enough people join, help me test real commitment without becoming the organizer of a plan that may never happen.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><h3 className="text-lg font-semibold">Product principle</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]"><strong className="text-[var(--ink)]">An idea is not an event yet.</strong> Before quorum, the interface says “if it happens.” That wording is a product decision designed to lower the cost of proposing something casual.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><h3 className="text-lg font-semibold">Deliberate non-goal</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]">No public feed, no reliability score, no follower graph, and no AI deciding whether the plan is confirmed. Those features would either add pressure or obscure the core experiment.</p></article>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">03 · Measure</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">The metric is not “people tapped RSVP.”</h2><p className="mt-5 text-sm leading-7 text-[var(--muted)]">The real job happens outside the browser. The long-term north star is confirmed plans that actually happen. Until a post-event attendance check exists, the product should track quorum conversion, time to quorum, repeat creation, and cancellation-after-unlock as a guardrail.</p></div>
            <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]">{metricRows.map(([kind,metric,why]) => <div key={metric} className="grid gap-2 border-b border-[var(--line)] px-5 py-5 last:border-0 md:grid-cols-[0.65fr_0.9fr_1.45fr]"><span className="font-mono text-[11px] uppercase text-[var(--signal)]">{kind}</span><strong className="text-sm">{metric}</strong><p className="text-sm leading-6 text-[var(--muted)]">{why}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-[2rem] bg-[var(--ink)] p-7 text-white md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/55">04 · Experiment</p>
            <div className="mt-5 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><h2 className="text-4xl font-semibold tracking-[-0.045em]">Does blind quorum actually help?</h2><p className="mt-5 text-sm leading-7 text-white/65">That is the highest-risk product assumption, so I would test it directly instead of treating it as branding.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white/8 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#cfc1ff]">Control</p><p className="mt-3 text-sm leading-6">Show the yes count and names of people already committed.</p></div><div className="rounded-2xl bg-white/8 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#c6f6dc]">Treatment</p><p className="mt-3 text-sm leading-6">Show only the yes count until quorum, then reveal the names.</p></div><div className="rounded-2xl bg-white/8 p-5 sm:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">Judge it on</p><p className="mt-3 text-sm leading-6">RSVP completion, response speed, quorum conversion, participant confusion, and cancellation after reveal. The design changes if the evidence says it should.</p></div></div></div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">05 · Engineer the rule that matters</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.045em]">Privacy and quorum live in the data layer, not just the interface.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><p className="font-mono text-xs text-[var(--signal)]">PRE-QUORUM</p><h3 className="mt-3 font-semibold">API returns count, not identities.</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Response rows are never queried directly by the browser. RLS is enabled and public table access is revoked.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><p className="font-mono text-xs text-[var(--signal)]">THRESHOLD</p><h3 className="mt-3 font-semibold">PostgreSQL locks and confirms atomically.</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Concurrent RSVPs cannot produce two conflicting transitions because the database owns the state change.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6"><p className="font-mono text-xs text-[var(--signal)]">POST-QUORUM</p><h3 className="mt-3 font-semibold">Reveal logistics, not private history.</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">The guest list contains confirmed yes participants. Emails and individual no votes remain private.</p></article>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-8 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 lg:grid-cols-[0.8fr_1.2fr] md:p-10"><div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">06 · Launch like a PM</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Private beta before feature accumulation.</h2></div><div><p className="text-sm leading-7 text-[var(--muted)]">The launch plan starts with 5–10 real friend groups and asks them to use Enough for an actual plan—not “test the app.” I would watch the first-use flow, run a two-week diary study, instrument time-to-quorum and repeat creation, and only then decide whether the next problem is candidate times, saved circles, calendar availability, or something else.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/enough" className="btn-primary rounded-full px-5">Try Enough →</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/enough/docs" target="_blank" rel="noreferrer" className="btn-secondary">Read the full PRD + research ↗</a></div></div></div>
        </div>
      </section>
    </main>
  );
}
