import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { SectionHeading } from "@/components/section-heading";
import { experienceHighlights, impact, principles, site } from "@/lib/site";

const toolkit = [
  {
    area: "Product + application",
    tools: ["React", "TypeScript", "Next.js", "Python", "FastAPI", "Pydantic", "REST APIs"],
    proof: "Portfolio UI, server routes, Sentinel backend, secure knowledge workflow",
  },
  {
    area: "Models + agents",
    tools: ["OpenAI Responses API", "Tool calling", "Structured outputs", "Model routing", "MCP", "Human approval"],
    proof: "Sentinel live investigation loop and policy boundary",
  },
  {
    area: "Retrieval + knowledge",
    tools: ["RAG", "Embeddings", "Vector similarity", "PostgreSQL", "pgvector", "ACL filtering", "Citations"],
    proof: "Secure Knowledge Assistant + repository reference architecture",
  },
  {
    area: "Production systems",
    tools: ["Redis", "Docker", "Kubernetes", "Terraform", "AWS patterns", "GitHub Actions", "CI/CD"],
    proof: "Containerized backends, infrastructure reference, automated validation",
  },
  {
    area: "Quality + operations",
    tools: ["Evals", "Pytest", "Observability", "Tracing", "Latency budgets", "Cost telemetry", "Regression tests"],
    proof: "Sentinel safety suite, run traces, CI, per-run telemetry",
  },
  {
    area: "Security + integrations",
    tools: ["OAuth/OIDC patterns", "RBAC/ACLs", "Prompt-injection defense", "Bounded tools", "External APIs", "Connector patterns"],
    proof: "Permission-aware retrieval, policy engine, Federal Register integration",
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
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Applied AI</span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">Production systems</span>
            </div>
            <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[84px] lg:leading-[0.98]">I turn hard, ambiguous problems into software people can actually use.</h1>
            <p className="mt-8 max-w-3xl text-balance text-lg leading-8 text-[var(--muted)] md:text-xl">I work across product interfaces, backend services, AI systems, data integrations, security, reliability, and deployment. The projects below are designed to show the system working—not just describe a stack.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="#projects" className="btn-primary rounded-full px-5">Explore selected projects →</Link><Link href="#experience" className="btn-secondary">Production experience</Link></div>
          </div>
          <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">{impact.map((item) => <div key={item.label} className="bg-[var(--surface)] p-6 md:p-7"><p className="text-3xl font-semibold tracking-[-0.04em]">{item.value}</p><p className="mt-2 text-sm font-medium">{item.label}</p><p className="mt-4 text-xs leading-5 text-[var(--muted)]">{item.detail}</p></div>)}</div>
        </div>
      </section>

      <section id="projects" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="Selected projects" title="Each project solves a different kind of problem." body="The portfolio is intentionally small. Sentinel demonstrates agentic production systems, Secure Knowledge Assistant demonstrates retrieval and authorization, and Policy Radar demonstrates a reliable data product where an LLM is not the answer." />

          <div className="mt-12 space-y-6">
            <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">01 · Flagship · Sentinel</p>
                  <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] md:text-6xl">Find the cause of a production incident before changing the wrong thing.</h2>
                  <p className="mt-6 text-base leading-7 text-[var(--muted)]">When a service suddenly fails, engineers usually jump between dashboards, logs, deployments, databases, runbooks, and code changes. Sentinel gives an AI investigation agent bounded access to those evidence sources, lets it decide what to inspect next, and keeps remediation behind deterministic policy and human approval.</p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Input</p><p className="mt-2 text-sm">A production symptom such as “checkout failures jumped to 17%.”</p></div><div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Outcome</p><p className="mt-2 text-sm">Evidence-backed root cause, confidence, safe next action, recovery check, and postmortem.</p></div></div>
                  <div className="mt-8 flex flex-wrap gap-3"><Link href="/projects/sentinel" className="btn-primary rounded-full px-5">Run Sentinel →</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/sentinel" target="_blank" rel="noreferrer" className="btn-secondary">Source + architecture ↗</a></div>
                </div>
                <div>
                  <ProjectHowItWorks
                    steps={[
                      { title: "Receive an incident", body: "A reproducible simulator creates the same kinds of symptoms a production team would see." },
                      { title: "Choose evidence adaptively", body: "The model can call read-only tools for metrics, logs, deployments, database diagnostics, runbooks, source changes, and past incidents." },
                      { title: "Build and test hypotheses", body: "Each observation changes what the agent investigates next instead of following one fixed script." },
                      { title: "Recommend a remediation", body: "The model proposes the lowest-risk action supported by evidence and explains alternatives." },
                      { title: "Enforce policy outside the model", body: "A deterministic policy engine decides whether the action is allowed and whether approval is required." },
                      { title: "Verify recovery", body: "Approved actions only affect simulated infrastructure; Sentinel then checks recovery metrics and creates a postmortem." },
                    ]}
                    toolGroups={[
                      { label: "Live in the project", items: ["OpenAI Responses API", "Tool calling", "Next.js", "TypeScript", "Policy engine", "Run telemetry"] },
                      { label: "Implemented in repo", items: ["Python", "FastAPI", "Pydantic", "MCP SDK v2", "PostgreSQL", "pgvector", "Pytest"] },
                      { label: "Production reference", items: ["Redis", "Docker", "Kubernetes", "Terraform", "AWS", "OpenTelemetry"] },
                    ]}
                    note="The public site uses synthetic incidents and simulated remediation so anyone can exercise the full control flow without touching real infrastructure."
                  />
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">02 · Secure RAG · Live embeddings</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Answer from company knowledge without leaking documents the user cannot access.</h2>
                  <p className="mt-5 text-sm leading-7 text-[var(--muted)]">Secure Knowledge Assistant makes authorization part of retrieval. A user identity is resolved first, inaccessible documents are removed, semantic search runs only over allowed knowledge, and the language model receives only authorized evidence.</p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Try it</p><p className="mt-2 text-sm">Ask the pricing question as a general employee, then switch identities and ask again.</p></div><div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What changes</p><p className="mt-2 text-sm">The retrieval set itself changes before the model receives context.</p></div></div>
                  <Link href="/projects/secure-knowledge" className="btn-primary mt-8 rounded-full px-5">Run secure retrieval →</Link>
                </div>
                <div>
                  <ProjectHowItWorks
                    steps={[
                      { title: "Resolve a trusted identity", body: "The server maps the selected persona to a controlled set of groups." },
                      { title: "Apply the ACL filter", body: "Restricted documents are removed before semantic retrieval." },
                      { title: "Create embeddings", body: "text-embedding-3-small represents the question and authorized documents as vectors." },
                      { title: "Rank evidence", body: "Cosine similarity selects the most relevant allowed sources." },
                      { title: "Generate a grounded answer", body: "GPT-5.6 Luna answers only from the authorized context and cites source IDs." },
                      { title: "Expose the trace", body: "The UI returns source scores, blocked-source count, model, retrieval mode, and latency." },
                    ]}
                    toolGroups={[
                      { label: "Live in the project", items: ["OpenAI Embeddings", "GPT-5.6 Luna", "RAG", "ACL filtering", "Citations", "Next.js API"] },
                      { label: "Implemented in repo", items: ["FastAPI", "PostgreSQL", "pgvector", "MCP", "Evals", "GitHub Actions"] },
                      { label: "Production reference", items: ["Redis cache", "OAuth/OIDC", "Docker", "Kubernetes", "Terraform", "Observability"] },
                    ]}
                  />
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">03 · Live data product · AI Policy Radar</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">See new U.S. federal AI-related actions without manually searching government sites.</h2>
                  <p className="mt-5 text-sm leading-7 text-[var(--muted)]">Policy Radar reads a live Federal Register API, normalizes recent AI-related documents, caches results, computes a small activity summary, links every record back to the primary source, and degrades cleanly when the upstream API is unavailable.</p>
                  <div className="mt-7 rounded-2xl bg-[var(--bg)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Why no LLM?</p><p className="mt-2 text-sm leading-6">The core problem is trustworthy monitoring and source provenance. A model would add cost and uncertainty without improving the basic job.</p></div>
                  <Link href="/projects/policy-radar" className="btn-primary mt-8 rounded-full px-5">Open Policy Radar →</Link>
                </div>
                <div>
                  <ProjectHowItWorks
                    steps={[
                      { title: "Query the primary source", body: "The server requests newest-first artificial-intelligence documents from the Federal Register API." },
                      { title: "Cache the response", body: "Next.js revalidation avoids unnecessary calls while keeping the page fresh." },
                      { title: "Normalize records", body: "Agency, date, type, title, abstract, and primary-source URLs are shaped into a stable UI contract." },
                      { title: "Compute a summary", body: "The current sample is grouped to show which agencies appear most often." },
                      { title: "Preserve provenance", body: "Every result links back to the original government source rather than an AI-generated retelling." },
                      { title: "Fail visibly", body: "Upstream errors produce an explicit degraded state instead of stale or fabricated data." },
                    ]}
                    toolGroups={[
                      { label: "Live in the project", items: ["Next.js Server Components", "Federal Register API", "Server fetch", "Caching", "Data normalization"] },
                      { label: "Reliability", items: ["Source provenance", "Error handling", "Graceful degradation", "Primary-source links"] },
                      { label: "Engineering judgment", items: ["No unnecessary LLM", "Simple data contract", "Low-cost deployment", "Readable UI"] },
                    ]}
                  />
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionHeading eyebrow="AI engineering toolkit" title="The tools are tied to concrete system responsibilities." body="A technology name matters less than knowing why it is there. This map shows where each part of the modern AI application stack appears across the selected projects and repository." />
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

      <section id="thinking" className="border-b border-[var(--line)]"><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><SectionHeading eyebrow="How I think" title="Engineering principles that travel across products, AI, and infrastructure." /><div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">{principles.map(([title, body], i) => <div key={title} className="grid gap-4 py-7 md:grid-cols-[80px_0.7fr_1.3fr] md:items-start"><span className="font-mono text-xs text-[var(--muted)]">0{i + 1}</span><h3 className="font-semibold">{title}</h3><p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{body}</p></div>)}</div></div></section>

      <section><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><div className="rounded-[2rem] bg-[var(--ink)] px-7 py-12 text-white md:px-12 md:py-16"><p className="font-mono text-xs uppercase tracking-[0.16em] text-white/60">Contact</p><h2 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">I like problems that cross product, systems, data, and AI.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-white/70">I’m interested in work where I can understand the user, shape the architecture, build across the stack, measure what happens in production, and improve the system after launch.</p><div className="mt-8 flex flex-wrap gap-3"><a href={`mailto:${site.email}`} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-85">Email me</a><a href={site.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black">LinkedIn ↗</a></div></div></div></section>
    </main>
  );
}
