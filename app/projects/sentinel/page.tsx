import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { SentinelConsole } from "@/components/sentinel-console";
import { runDeterministicSafetyEvals } from "@/lib/sentinel/evals";
import { publicScenario, SENTINEL_SCENARIOS } from "@/lib/sentinel/scenarios";
import { TOOL_DEFINITIONS } from "@/lib/sentinel/tool-registry";

export const metadata = {
  title: "Sentinel — AI Production Incident Response Platform",
  description: "A live incident-response platform that investigates simulated production failures with OpenAI tool calling, evidence, policy enforcement, human approval, observability, and evaluations.",
};

export default function SentinelPage() {
  const scenarios = SENTINEL_SCENARIOS.map(publicScenario);
  const evalSummary = runDeterministicSafetyEvals();
  const liveConfigured = Boolean(process.env.OPENAI_API_KEY);

  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · Sentinel</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[80px] lg:leading-[0.98]">When production breaks, Sentinel investigates what changed and why.</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--muted)] md:text-xl">A service can fail for dozens of reasons. Sentinel gives an AI investigation agent a safe set of read-only tools so it can gather evidence across logs, metrics, deployments, code changes, database health, runbooks, and incident history before recommending what to do next.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Problem</p><p className="mt-3 text-sm leading-6">Production symptoms appear quickly, while the actual cause is scattered across several systems.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product</p><p className="mt-3 text-sm leading-6">An investigation agent that decides what evidence to inspect next and explains how that evidence supports a diagnosis.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Safety boundary</p><p className="mt-3 text-sm leading-6">The model can recommend an action. Deterministic code decides whether it is allowed and whether a human must approve it.</p></div>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Inject a reproducible incident", body: "Synthetic production data creates a known failure across services, telemetry, deployments, and dependencies." },
              { title: "Let the model choose evidence", body: "The OpenAI Responses API selects bounded read-only tools one step at a time based on the latest observation." },
              { title: "Update hypotheses", body: "Metrics, logs, deployment history, database state, runbooks, source changes, and past incidents change the diagnosis as evidence accumulates." },
              { title: "Recommend the safest action", body: "The agent returns a root cause, confidence, alternatives, evidence IDs, and a proposed remediation." },
              { title: "Enforce policy outside the model", body: "A deterministic policy engine checks permission and risk. High-risk actions require human approval." },
              { title: "Verify and learn", body: "Approved actions only modify simulated infrastructure. Sentinel verifies recovery, records telemetry, and produces a postmortem." },
            ]}
            toolGroups={[
              { label: "Live in this project", items: ["OpenAI Responses API", "Tool calling", "Model routing", "Next.js", "TypeScript", "Policy engine", "Human approval"] },
              { label: "Implemented in repo", items: ["Python", "FastAPI", "Pydantic", "MCP SDK v2", "PostgreSQL", "pgvector", "Pytest", "Docker Compose"] },
              { label: "Production reference", items: ["Redis", "Kubernetes", "Terraform", "AWS", "OpenTelemetry", "CI/CD"] },
            ]}
            note="The public environment is intentionally simulated. It exercises the full investigation and approval flow without granting an internet visitor access to real infrastructure."
          />

          <div className="mt-8 flex flex-wrap gap-3"><a href="#demo" className="btn-primary rounded-full px-5">Try an incident ↓</a><Link href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/sentinel" target="_blank" className="btn-secondary">Inspect source ↗</Link></div>
        </div>
      </section>

      <section id="demo" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 md:px-8 md:py-24">
          <div className="mb-10 max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Interactive incident simulation</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">Pick what broke. Then watch the investigation unfold.</h2>
            <p className="mt-5 text-base leading-7 text-[var(--muted)]">Every scenario explains the symptom in plain language first. After you run it, the technical trace shows which systems Sentinel inspected, what it learned from each one, how confident it became, and where the safety policy took control.</p>
          </div>
          <SentinelConsole scenarios={scenarios} liveConfigured={liveConfigured} evalSummary={evalSummary} />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Investigation tools</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">The agent can inspect eight bounded evidence sources.</h2>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">The tool surface is deliberately narrow. Sentinel can read operational evidence, but it cannot execute arbitrary shell commands or arbitrary SQL. Production-impacting actions live behind a separate remediation policy.</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]">{TOOL_DEFINITIONS.map((tool) => <div key={tool.name} className="grid gap-2 border-b border-[var(--line)] px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"><div><code className="text-sm font-semibold">{tool.name}()</code><p className="mt-1 text-xs text-[var(--muted)]">{tool.purpose}</p></div><span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px]">{tool.risk} risk · {tool.permission}</span></div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl bg-[var(--ink)] p-7 text-white md:p-9"><p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">Safety design</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">A correct model answer is not authorization.</h2><div className="mt-7 space-y-4 text-sm leading-6 text-white/75"><p>Logs and tool output are treated as data, not instructions.</p><p>Unknown actions are denied by default.</p><p>High-risk actions require a human.</p><p>The public demo only modifies simulated state.</p></div></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Measured controls</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">Safety behavior is regression-tested.</h2><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.policyPasses}/{evalSummary.totalCases}</p><p className="mt-1 text-xs text-[var(--muted)]">policy cases passed</p></div><div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.toolSchemaCoverage}%</p><p className="mt-1 text-xs text-[var(--muted)]">tool contract coverage</p></div><div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.approvalBypasses}</p><p className="mt-1 text-xs text-[var(--muted)]">approval bypasses</p></div><div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.injectionDetected}/{evalSummary.injectionCases}</p><p className="mt-1 text-xs text-[var(--muted)]">injection fixtures detected</p></div></div><p className="mt-5 text-xs leading-5 text-[var(--muted)]">These numbers measure deterministic controls. Live-model diagnosis quality belongs to a separate repeated model-evaluation dataset.</p></article>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Implementation depth</p>
          <h2 className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">The live interface is only one layer of the project.</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)]">The Sentinel directory includes the FastAPI service, MCP server, PostgreSQL/pgvector schema, simulator fixtures, Docker Compose environment, evaluation and security tests, CI validation, architecture notes, and Terraform reference infrastructure.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/sentinel" target="_blank" className="btn-primary rounded-full px-5">Inspect Sentinel source ↗</Link><Link href="/" className="btn-secondary">Back to selected projects</Link></div>
        </div>
      </section>
    </main>
  );
}
