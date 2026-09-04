import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { capabilities, engineeringSurface, experienceHighlights, impact, principles, site } from "@/lib/site";

const sentinelSignals = [
  "OpenAI tool calling",
  "MCP server",
  "FastAPI",
  "Policy engine",
  "Human approval",
  "Prompt-injection defense",
  "Observability",
  "Evaluation suite",
];

export default function Home() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28 lg:py-32">
          <div className="reveal max-w-6xl">
            <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">New York, NY</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Software engineering</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Applied AI</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Production systems</span>
            </div>
            <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[84px] lg:leading-[0.98]">I turn hard, ambiguous problems into software people can actually use.</h1>
            <p className="mt-8 max-w-3xl text-balance text-lg leading-8 text-[var(--muted)] md:text-xl">I build across the stack—from product interfaces and APIs to AI systems, data integrations, reliability, security, and deployment. My strongest work starts before the requirements are clean and continues after the code ships.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#projects" className="btn-primary rounded-full px-5">See what I built →</Link>
              <Link href="#experience" className="btn-secondary">Production experience</Link>
            </div>
          </div>
          <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
            {impact.map((item) => <div key={item.label} className="bg-[var(--surface)] p-6 md:p-7"><p className="text-3xl font-semibold tracking-[-0.04em]">{item.value}</p><p className="mt-2 text-sm font-medium">{item.label}</p><p className="mt-4 text-xs leading-5 text-[var(--muted)]">{item.detail}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="Engineering range" title="I can own more than one layer of the problem." body="The portfolio is organized around capabilities large engineering teams repeatedly need: product execution, backend systems, AI behavior, data movement, security, reliability, and measurable outcomes." />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {engineeringSurface.map((item) => <article key={item.label} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--signal)]">{item.label}</p><h3 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{item.value}</h3><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{item.proof}</p></article>)}
          </div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
            {capabilities.map((cap) => <article key={cap.title} className="bg-[var(--surface)] p-7 md:p-9"><h3 className="text-xl font-semibold tracking-[-0.025em]">{cap.title}</h3><p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">{cap.body}</p><div className="mt-6 flex flex-wrap gap-2">{cap.proof.map((item) => <span key={item} className="rounded-full bg-[var(--soft)] px-3 py-1.5 text-xs">{item}</span>)}</div></article>)}
          </div>
        </div>
      </section>

      <section id="projects" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="Selected projects" title="Two products, two different problems." body="I would rather show a small number of projects with a clear purpose than a wall of agent demos. Sentinel is the deep AI-systems build; Policy Radar is a live-data product that proves I also know when an LLM is not the solution." />

          <article className="mt-12 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)]">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-7 md:p-10">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">01 · Flagship · Sentinel</p>
                <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] md:text-6xl">A production incident happens. Sentinel investigates why.</h2>
                <p className="mt-6 text-base leading-7 text-[var(--muted)]">Imagine checkout failures suddenly jump from almost zero to 17%. An engineer normally opens dashboards, searches logs, checks the latest deployment, reads a runbook, forms hypotheses, and decides whether a rollback is safe. Sentinel performs that investigation with a live model and bounded tools, then stops at a deterministic approval boundary before any production-impacting action.</p>
                <div className="mt-7 flex flex-wrap gap-2">{sentinelSignals.map((signal) => <span key={signal} className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs">{signal}</span>)}</div>
                <div className="mt-8 flex flex-wrap gap-3"><Link href="/projects/sentinel" className="btn-primary rounded-full px-5">Watch Sentinel investigate →</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/sentinel" target="_blank" rel="noreferrer" className="btn-secondary">Source + architecture ↗</a></div>
              </div>
              <div className="border-t border-[var(--line)] bg-[var(--bg)] p-7 lg:border-l lg:border-t-0 md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What a recruiter can see happen</p>
                <div className="mt-5 space-y-3">
                  {[
                    ["1", "A real-looking incident appears", "Payment failures spike immediately after a release."],
                    ["2", "The agent decides what evidence to inspect", "Metrics → logs → deployment → code change → runbook."],
                    ["3", "It explains the root cause", "A concurrency increase exhausted the database connection pool."],
                    ["4", "Safety code takes over", "Rollback is recommended, but the model cannot approve its own action."],
                    ["5", "A human approves the simulated recovery", "The environment recovers and Sentinel generates a postmortem."],
                  ].map(([n, title, body]) => <div key={n} className="grid grid-cols-[34px_1fr] gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"><span className="font-mono text-xs text-[var(--signal)]">{n}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{body}</p></div></div>)}
                </div>
              </div>
            </div>
          </article>

          <article className="mt-6 grid gap-6 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">02 · Live data product · AI Policy Radar</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Know when a new U.S. federal AI rule or notice appears.</h2>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">Policy teams should not have to manually search government sites every day to know what changed. Policy Radar reads the Federal Register’s public API, normalizes new AI-related documents, caches results, links every item to the primary government source, and fails gracefully when the upstream API has a problem.</p>
              <div className="mt-6 flex flex-wrap gap-2">{["Next.js", "Federal Register API", "Caching", "Normalization", "Source provenance", "Failure handling"].map((x) => <span key={x} className="rounded-full bg-[var(--soft)] px-3 py-1.5 text-xs">{x}</span>)}</div>
              <Link href="/projects/policy-radar" className="btn-secondary mt-8">Open the live product →</Link>
            </div>
            <div className="rounded-2xl bg-[var(--bg)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Why this project exists</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><p className="text-lg font-semibold">Problem</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Important regulatory updates are distributed across a government data source and change continuously.</p></div>
                <div><p className="text-lg font-semibold">Product</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">A focused monitoring interface that surfaces recent AI-related actions and preserves the original source.</p></div>
                <div><p className="text-lg font-semibold">What it proves</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">External API integration, data contracts, caching, resilient server code, and product judgment.</p></div>
                <div><p className="text-lg font-semibold">Why no LLM?</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">The core job is trustworthy retrieval and presentation. Adding a model would increase complexity without improving that basic task.</p></div>
              </div>
            </div>
          </article>

          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 text-sm leading-6 text-[var(--muted)]">
            <strong className="text-[var(--ink)]">Supporting engineering demos:</strong> I also keep smaller server-executed examples for permission-aware retrieval, technical discovery, and reliability behavior. They are there to inspect individual design decisions, not to pretend each one is a separate startup-sized product. <Link href="/labs" className="font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4">View supporting demos →</Link>
          </div>
        </div>
      </section>

      <section id="experience" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="Production experience" title="Enterprise engineering at S&P Global." body="The public projects show what I can explain openly. My professional work adds the harder production context: real integrations, permissions, reliability, organizational scale, and cross-functional delivery." />
          <div className="mt-12">
            {experienceHighlights.map((x) => <article key={x.company} className="grid gap-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 md:grid-cols-[0.55fr_1.45fr] md:p-9"><div><p className="text-2xl font-semibold tracking-[-0.03em]">{x.company}</p><p className="mt-2 text-sm text-[var(--muted)]">{x.role}</p></div><div><p className="max-w-3xl text-lg leading-8">{x.body}</p><div className="mt-7 grid gap-3">{x.bullets.map((b) => <div key={b} className="flex gap-4 border-t border-[var(--line)] pt-4 text-sm leading-6 text-[var(--muted)]"><span className="font-mono text-[var(--signal)]">↳</span><p>{b}</p></div>)}</div></div></article>)}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-4 text-sm"><span><strong>Princeton University</strong> · B.S.E. Computer Science</span><span className="text-[var(--muted)]">Resume available directly to recruiting teams on request.</span></div>
          </div>
        </div>
      </section>

      <section id="thinking" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="How I think" title="Engineering principles that travel across products, AI, and infrastructure." />
          <div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {principles.map(([title, body], i) => <div key={title} className="grid gap-4 py-7 md:grid-cols-[80px_0.7fr_1.3fr] md:items-start"><span className="font-mono text-xs text-[var(--muted)]">0{i + 1}</span><h3 className="font-semibold">{title}</h3><p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{body}</p></div>)}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="rounded-[2rem] bg-[var(--ink)] px-7 py-12 text-white md:px-12 md:py-16">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/60">Next problem</p>
            <h2 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">Give me the problem before someone has already reduced it to a ticket.</h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70">I’m interested in roles where I can understand the user, shape the technical approach, build across the stack, measure what happens in production, and keep improving the system after launch.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href={`mailto:${site.email}`} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-85">Email me</a><a href={site.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black">LinkedIn ↗</a></div>
          </div>
        </div>
      </section>
    </main>
  );
}
