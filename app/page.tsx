import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { SectionHeading } from "@/components/section-heading";
import { experienceHighlights, impact, principles, site } from "@/lib/site";

const toolkit = [
  {
    area: "Deployment strategy + enterprise adoption",
    tools: ["Workflow mapping", "Use-case sequencing", "Stakeholder discovery", "Pilot design", "Golden sets", "Rollout gates", "Human approval", "Deployment perimeters"],
    proof: "FieldGuide: discovery → workflow economics → governed runbook → historical replay → eval gates → 30/60/90 deployment",
  },
  {
    area: "Product management + strategy",
    tools: ["Problem framing", "Jobs to be Done", "Competitive research", "PRDs", "MVP scoping", "North-star metrics", "Experiment design", "Roadmapping"],
    proof: "Enough: real problem → market research → product wedge → PRD → working product → metrics → private-beta plan",
  },
  {
    area: "Product + application",
    tools: ["React", "TypeScript", "Next.js", "Python", "FastAPI", "Pydantic", "REST APIs"],
    proof: "Enough, portfolio UI, server routes, Sentinel backend, secure knowledge workflow",
  },
  {
    area: "Models + agents",
    tools: ["OpenAI Responses API", "Tool calling", "Structured outputs", "Model routing", "MCP", "Human approval"],
    proof: "Sentinel live investigation loop and policy boundary",
  },
  {
    area: "Retrieval + knowledge",
    tools: ["RAG", "Embeddings", "Vector similarity", "PostgreSQL", "pgvector", "ACL filtering", "Citations"],
    proof: "Secure Knowledge Assistant + Voiceprint Studio + repository reference architecture",
  },
  {
    area: "Production systems",
    tools: ["Supabase", "PostgreSQL", "Redis", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CI/CD"],
    proof: "Enough transactional quorum backend, containerized services, infrastructure references, automated validation",
  },
  {
    area: "Quality + operations",
    tools: ["Evals", "Pytest", "Observability", "Tracing", "Latency budgets", "Cost telemetry", "Regression tests"],
    proof: "Sentinel safety suite, production smoke tests, run traces, CI, per-run telemetry",
  },
  {
    area: "Security + integrations",
    tools: ["OAuth/OIDC patterns", "RBAC/ACLs", "RLS", "Hashed capability tokens", "Prompt-injection defense", "External APIs", "Connector patterns"],
    proof: "Permission-aware retrieval, Enough private quorum, policy engine, Federal Register integration",
  },
];

export default function Home() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28 lg:py-32">
          <div className="max-w-6xl">
            <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">New York, NY</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Software engineering</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Product strategy</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Applied AI</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Production systems</span>
            </div>
            <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[84px] lg:leading-[0.98]">I turn hard, ambiguous problems into software people can actually use.</h1>
            <p className="mt-8 max-w-3xl text-balance text-lg leading-8 text-[var(--muted)] md:text-xl">I work across product strategy, interfaces, backend services, AI systems, data integrations, security, reliability, and deployment. The projects below show both the decisions and the system working—not just a list of technologies.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="#projects" className="btn-primary rounded-full px-5">Explore selected projects →</Link><Link href="#experience" className="btn-secondary">Production experience</Link></div>
          </div>
          <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">{impact.map((item) => <div key={item.label} className="bg-[var(--surface)] p-6 md:p-7"><p className="text-3xl font-semibold tracking-[-0.04em]">{item.value}</p><p className="mt-2 text-sm font-medium">{item.label}</p><p className="mt-4 text-xs leading-5 text-[var(--muted)]">{item.detail}</p></div>)}</div>
        </div>
      </section>

      <section id="projects" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="Selected projects" title="Each project solves a different kind of problem." body="FieldGuide demonstrates enterprise AI deployment strategy from workflow discovery through eval-gated rollout; Sentinel demonstrates production agent systems, Secure Knowledge demonstrates retrieval and authorization, Enough demonstrates end-to-end product management, and Policy Radar demonstrates reliable software where an LLM is deliberately not the answer." />

          <div className="mt-12 space-y-6">
            <article className="overflow-hidden rounded-[2rem] border border-[#2e3b3e] bg-[#0d1618] text-white">
              <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
                <div className="p-7 md:p-10">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#b8ff5b]/35 bg-[#b8ff5b]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#b8ff5b]">01 · Deployment strategy flagship</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">Enterprise agents</span>
                  </div>
                  <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] md:text-6xl">FieldGuide: turn a messy workflow into an AI deployment you can defend.</h2>
                  <p className="mt-6 text-sm leading-7 text-white/60">Map the operator workflow, rank the first automation wedge, configure systems and permissions, replay a historical case, inject a worker failure, run golden-set gates, and sequence shadow mode → assisted production → bounded automation.</p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/[0.055] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Starts with</p><p className="mt-2 text-sm font-semibold">Workflow economics</p></div>
                    <div className="rounded-2xl bg-white/[0.055] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Hard boundary</p><p className="mt-2 text-sm font-semibold">Model ≠ authority</p></div>
                    <div className="rounded-2xl bg-white/[0.055] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Release gate</p><p className="mt-2 text-sm font-semibold">Golden sets + policy</p></div>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3"><Link href="/projects/fieldguide" className="inline-flex items-center justify-center rounded-full bg-[#b8ff5b] px-5 py-3 text-sm font-black text-[#0d1618]">Open FieldGuide →</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/fieldguide" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">Architecture ↗</a></div>
                </div>
                <div className="border-t border-white/10 p-7 md:p-10 lg:border-l lg:border-t-0">
                  <ProjectHowItWorks
                    steps={[
                      { title: "Discover", body: "Map operators, systems, handoffs, exceptions, baseline pain, and the real decision boundary." },
                      { title: "Sequence", body: "Score candidate workflows on value, readiness, reversibility, sponsor strength, and risk." },
                      { title: "Pilot safely", body: "Run a governed trace where identity, policy, approval, and writes sit outside model authority." },
                      { title: "Prove + roll out", body: "Golden-set regressions gate changes; cohort expands before consequential authority." },
                    ]}
                    toolGroups={[
                      { label: "Strategy", items: ["Workflow mapping", "Use-case sequencing", "30/60/90 rollout", "Stakeholder operating model"] },
                      { label: "Agents", items: ["OpenAI Responses API", "Step-level routing", "MCP reference", "Durable workflow reference"] },
                      { label: "Controls", items: ["Per-action authorization", "Human approval", "Golden-set evals", "Fault injection"] },
                    ]}
                  />
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">02 · Flagship · Sentinel</p>
                  <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] md:text-6xl">Find the cause of a production incident before changing the wrong thing.</h2>
                  <p className="mt-6 text-base leading-7 text-[var(--muted)]">When a service suddenly fails, engineers usually jump between dashboards, logs, deployments, databases, runbooks, and code changes. Sentinel gives an AI investigation agent bounded access to those evidence sources, lets it decide what to inspect next, and keeps remediation behind deterministic policy and human approval.</p>
                  <div className="mt-8 flex flex-wrap gap-3"><Link href="/projects/sentinel" className="btn-primary rounded-full px-5">Run Sentinel →</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/sentinel" target="_blank" rel="noreferrer" className="btn-secondary">Source + architecture ↗</a></div>
                </div>
                <ProjectHowItWorks
                  steps={[
                    { title: "Receive an incident", body: "Start with symptoms instead of a pre-labeled answer." },
                    { title: "Choose evidence adaptively", body: "Call bounded tools for metrics, logs, deployments, database diagnostics, runbooks, source changes, and past incidents." },
                    { title: "Build and test hypotheses", body: "Each observation changes what the agent investigates next." },
                    { title: "Enforce authority outside the model", body: "Deterministic policy decides whether a recommended action is allowed or needs human approval." },
                  ]}
                  toolGroups={[
                    { label: "AI", items: ["OpenAI Responses API", "Tool calling", "MCP", "Model routing", "Structured outputs"] },
                    { label: "Backend", items: ["Python", "FastAPI", "Pydantic", "PostgreSQL", "pgvector"] },
                    { label: "Production", items: ["Docker", "Kubernetes", "Terraform", "Redis", "GitHub Actions", "Observability"] },
                  ]}
                />
              </div>
            </article>

            <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">03 · Secure RAG · Authorization first</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Answer from company knowledge without leaking documents the user cannot access.</h2>
                  <p className="mt-5 text-sm leading-7 text-[var(--muted)]">Secure Knowledge Assistant makes authorization part of retrieval. A user identity is resolved first, inaccessible documents are removed, retrieval runs only over allowed knowledge, and the language model receives only authorized evidence.</p>
                  <Link href="/projects/secure-knowledge" className="btn-primary mt-8 rounded-full px-5">Run secure retrieval →</Link>
                </div>
                <ProjectHowItWorks
                  steps={[
                    { title: "Resolve identity", body: "Map the user to trusted groups." },
                    { title: "Filter before retrieval", body: "Remove restricted knowledge before the model can ever see it." },
                    { title: "Rank allowed evidence", body: "Hybrid retrieval selects useful context from the permitted corpus." },
                    { title: "Generate with citations", body: "Answer from authorized evidence and expose the source trail." },
                  ]}
                  toolGroups={[
                    { label: "AI", items: ["RAG", "Hybrid retrieval", "GPT-5.6 Luna", "Citations", "Evals"] },
                    { label: "Data", items: ["PostgreSQL", "pgvector reference", "Metadata", "ACL filtering"] },
                    { label: "Security", items: ["RBAC/ACLs", "Least privilege", "Auditability"] },
                  ]}
                />
              </div>
            </article>

            <article className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)]">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-[#1e1b18] p-7 text-white md:p-10">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#cfc1ff]">04 · Product management + full-stack product</p>
                  <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] md:text-5xl">Enough: a casual plan only becomes real when enough friends privately commit.</h2>
                  <p className="mt-6 text-sm leading-7 text-white/65">I took this from a personal problem through competitor research, product definition, PRD, MVP scope, privacy model, metrics, experiment design, architecture, and a working responsive web app. Before quorum only the count is visible; at quorum the plan auto-confirms and the guest list reveals.</p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white/8 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Product hypothesis</p><p className="mt-2 text-sm">Blind conditional commitment can reduce “who else is going?” pressure.</p></div><div className="rounded-2xl bg-white/8 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">North-star direction</p><p className="mt-2 text-sm">Confirmed plans that actually happen—not time spent in the app.</p></div></div>
                  <div className="mt-8 flex flex-wrap gap-3"><Link href="/enough" className="inline-flex items-center justify-center rounded-full bg-[#ff8f70] px-5 py-3 text-sm font-black text-[#1e1b18]">Use Enough →</Link><Link href="/projects/enough" className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">Read product case study</Link></div>
                </div>
                <div className="p-7 md:p-10">
                  <ProjectHowItWorks
                    steps={[
                      { title: "Discover", body: "Separate the turnout problem from calendar scheduling and formal event-hosting problems." },
                      { title: "Differentiate", body: "Research showed thresholds and anonymous polls already exist, so the wedge became blind quorum followed by post-confirmation reveal." },
                      { title: "Build", body: "Ship create → share → private RSVP → atomic confirmation → guest reveal → calendar handoff." },
                      { title: "Measure", body: "Define quorum conversion, time to quorum, repeat creation, cancellation guardrails, and a post-event reality check." },
                    ]}
                    toolGroups={[
                      { label: "Product", items: ["JTBD", "Competitive research", "PRD", "MVP", "Metric tree", "A/B tests", "Launch roadmap"] },
                      { label: "Application", items: ["Next.js 16", "React 19", "TypeScript", "Web Share", "ICS", "Mobile-first UX"] },
                      { label: "Production", items: ["Supabase", "PostgreSQL", "RLS", "Atomic RPC", "Hashed capability tokens", "Resend hook"] },
                    ]}
                  />
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">05 · Live data product · AI Policy Radar</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">See new U.S. federal AI-related actions without manually searching government sites.</h2>
                  <p className="mt-5 text-sm leading-7 text-[var(--muted)]">Policy Radar reads the Federal Register API, normalizes recent AI-related documents, caches results, links every record to the primary source, and degrades cleanly when the upstream API is unavailable.</p>
                  <Link href="/projects/policy-radar" className="btn-primary mt-8 rounded-full px-5">Open Policy Radar →</Link>
                </div>
                <ProjectHowItWorks
                  steps={[
                    { title: "Query the primary source", body: "Request newest-first AI-related documents from the Federal Register API." },
                    { title: "Cache + normalize", body: "Avoid unnecessary calls and convert changing source data into a stable application contract." },
                    { title: "Preserve provenance", body: "Every result links back to the government source instead of an AI retelling." },
                    { title: "Fail visibly", body: "An upstream problem produces an explicit degraded state rather than fabricated data." },
                  ]}
                  toolGroups={[
                    { label: "Application", items: ["Next.js Server Components", "REST API", "Server fetch", "Caching"] },
                    { label: "Data", items: ["Normalization", "Source provenance", "Error handling"] },
                    { label: "Judgment", items: ["No unnecessary LLM", "Low-cost architecture", "Readable UI"] },
                  ]}
                />
              </div>
            </article>

            <div className="pt-2 text-center"><Link href="/projects" className="btn-secondary">See Voiceprint, SignalBrief, evaluation work, and all projects →</Link></div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="Skills + capabilities" title="The tools are tied to concrete responsibilities and decisions." body="A technology or framework name matters less than knowing why it is there. This map covers the product, AI, application, data, production, quality, and security work represented across the portfolio." />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{toolkit.map((group) => <article key={group.area} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><h3 className="text-lg font-semibold">{group.area}</h3><div className="mt-4 flex flex-wrap gap-2">{group.tools.map((tool) => <span key={tool} className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px]">{tool}</span>)}</div><p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Where it shows up:</strong> {group.proof}</p></article>)}</div>
          <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Some infrastructure components are reference implementations rather than services running in the public Vercel deployment. Project pages label that distinction explicitly.</p>
        </div>
      </section>

      <section id="experience" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="Production experience" title="Enterprise engineering at S&P Global." body="The public projects show what I can explain openly. My professional work adds the harder context: real integrations, permissions, reliability, organizational scale, and delivery across technical and business teams." />
          <div className="mt-12">{experienceHighlights.map((x) => <article key={x.company} className="grid gap-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 md:grid-cols-[0.55fr_1.45fr] md:p-9"><div><p className="text-2xl font-semibold tracking-[-0.03em]">{x.company}</p><p className="mt-2 text-sm text-[var(--muted)]">{x.role}</p></div><div><p className="max-w-3xl text-lg leading-8">{x.body}</p><div className="mt-7 grid gap-3">{x.bullets.map((b) => <div key={b} className="flex gap-4 border-t border-[var(--line)] pt-4 text-sm leading-6 text-[var(--muted)]"><span className="font-mono text-[var(--signal)]">↳</span><p>{b}</p></div>)}</div></div></article>)}<div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-4 text-sm"><strong>Princeton University</strong> · B.S.E. Computer Science</div></div>
        </div>
      </section>

      <section id="thinking" className="border-b border-[var(--line)]"><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><SectionHeading eyebrow="How I think" title="Principles that travel across products, AI, and infrastructure." /><div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">{principles.map(([title, body], i) => <div key={title} className="grid gap-4 py-7 md:grid-cols-[80px_0.7fr_1.3fr] md:items-start"><span className="font-mono text-xs text-[var(--muted)]">0{i + 1}</span><h3 className="font-semibold">{title}</h3><p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{body}</p></div>)}</div></div></section>

      <section><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><div className="rounded-[2rem] bg-[var(--ink)] px-7 py-12 text-white md:px-12 md:py-16"><p className="font-mono text-xs uppercase tracking-[0.16em] text-white/60">Contact</p><h2 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">I like problems that cross product, systems, data, and AI.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-white/70">I’m interested in work where I can understand the user, shape the product and architecture, build across the stack, measure what happens in production, and improve the system after launch.</p><div className="mt-8 flex flex-wrap gap-3"><a href={`mailto:${site.email}`} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-85">Email me</a><a href={site.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black">LinkedIn ↗</a></div></div></div></section>
    </main>
  );
}
