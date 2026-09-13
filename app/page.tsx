import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { experienceHighlights, impact, principles, site } from "@/lib/site";

const toolkit = [
  {
    area: "Deployment strategy + enterprise adoption",
    tools: ["Workflow mapping", "Use-case sequencing", "Stakeholder discovery", "Pilot design", "Golden sets", "Rollout gates", "Human approval", "Deployment perimeters"],
    proof: "Atlas: deployment framing → risk visibility → governed decisions → measurable adoption",
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
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/projects" className="btn-primary rounded-full px-5">Explore projects →</Link><Link href="#experience" className="btn-secondary">Production experience</Link></div>
          </div>
          <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">{impact.map((item) => <div key={item.label} className="bg-[var(--surface)] p-6 md:p-7"><p className="text-3xl font-semibold tracking-[-0.04em]">{item.value}</p><p className="mt-2 text-sm font-medium">{item.label}</p><p className="mt-4 text-xs leading-5 text-[var(--muted)]">{item.detail}</p></div>)}</div>
        </div>
      </section>

      <section id="projects" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Selected work" title="Built for real decisions." body="A focused selection of product, AI, and production systems. The complete project library—including FieldGuide—lives in the Projects tab." />
            <Link href="/projects" className="btn-secondary shrink-0 self-start md:self-auto">View all projects →</Link>
          </div>

          <article className="mt-10 overflow-hidden rounded-[2rem] bg-[#171326] text-white">
            <div className="grid items-start gap-10 p-7 md:p-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#cfc1ff] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#171326]">Featured</span>
                  <span className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/75">Enterprise AI deployment</span>
                </div>
                <h2 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] md:text-6xl">Atlas turns an AI rollout into a decision system.</h2>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#cfc1ff]">What it does</p>
                <p className="mt-2 max-w-2xl text-base leading-7 text-white/70">One operating surface for rollout stages, stakeholders, risks, evidence, approvals, metrics, and the next actions needed to move an enterprise deployment forward.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="https://deployment-command-center.harpreet-kaur689368.chatgpt.site" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#cfc1ff] px-5 py-3 text-sm font-bold text-[#171326] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Open Atlas live ↗</a>
                  <Link href="/projects" className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-[#171326] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Project details →</Link>
                </div>
              </div>
              <div className="grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 sm:grid-cols-2">
                {[
                  ["01", "Frame", "Define outcomes, constraints, owners, and success measures."],
                  ["02", "Expose", "Surface risk, dependencies, evidence, and accountability."],
                  ["03", "Govern", "Use readiness signals and approvals for consequential decisions."],
                  ["04", "Advance", "Convert the current state into measurable next actions."],
                ].map(([number, title, body]) => (
                  <div key={number} className="bg-[#211b35] p-5">
                    <span className="font-mono text-xs text-[#cfc1ff]">{number}</span>
                    <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {[
              { label: "Production agent", title: "Sentinel", body: "Investigates incidents across telemetry and system evidence while keeping remediation behind deterministic policy.", href: "/projects/sentinel" },
              { label: "Permission-aware RAG", title: "Secure Knowledge Assistant", body: "Filters access before retrieval so the model only sees evidence the current user is allowed to use.", href: "/projects/secure-knowledge" },
              { label: "Full-stack product", title: "Enough", body: "A private quorum product taken from user problem and product strategy through a working application.", href: "/projects/enough" },
              { label: "Live public data", title: "AI Policy Radar", body: "Normalizes current Federal Register data with provenance, caching, and graceful failure behavior.", href: "/projects/policy-radar" },
            ].map((project) => (
              <article key={project.title} className="group flex min-h-64 flex-col rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-7 transition hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--ink)_35%,var(--line))] hover:shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">{project.label}</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{project.title}</h3>
                <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What it does</p>
                <p className="mt-2 text-base leading-7 text-[var(--muted)]">{project.body}</p>
                <Link href={project.href} className="mt-auto pt-7 text-sm font-bold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 transition group-hover:decoration-[var(--ink)]">Open project →</Link>
              </article>
            ))}
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
