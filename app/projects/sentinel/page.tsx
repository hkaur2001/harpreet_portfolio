import Link from "next/link";
import { SentinelConsole } from "@/components/sentinel-console";
import { runDeterministicSafetyEvals } from "@/lib/sentinel/evals";
import { publicScenario, SENTINEL_SCENARIOS } from "@/lib/sentinel/scenarios";
import { TOOL_DEFINITIONS } from "@/lib/sentinel/tool-registry";

export const metadata = {
  title: "Sentinel — AI Production Incident Response Platform",
  description: "A live incident-response platform that investigates simulated production failures with OpenAI tool calling, evidence, policy enforcement, human approval, observability, and evaluations.",
};

const architecture = [
  ["01", "Simulated production environment", "Reproducible services, logs, metrics, deployments, database state, runbooks, and incident history let the demo fail safely and consistently."],
  ["02", "Investigation agent", "The OpenAI model decides which bounded read-only tool to call next after each observation instead of following one hard-coded sequence."],
  ["03", "Tool gateway + MCP", "Operational capabilities have explicit schemas, permissions, risk metadata, timeouts, retries, and audit behavior. The same read surface is exposed through an MCP server."],
  ["04", "Knowledge + retrieval", "Runbooks and past incidents provide operational context. The standalone backend includes PostgreSQL + pgvector for metadata-aware retrieval."],
  ["05", "Deterministic policy engine", "The model may recommend an action, but normal code decides whether that action is allowed and whether a human must approve it."],
  ["06", "Approval + simulated remediation", "Production-impacting actions stop for a person. The public site changes only synthetic state, never real infrastructure."],
  ["07", "Security boundary", "Logs and tool results are treated as untrusted data. Embedded instructions cannot become higher-priority commands."],
  ["08", "Observability + evals", "Every run exposes tool choices, evidence, latency, tokens, estimated cost, policy decisions, and regression-tested safety behavior."],
] as const;

export default function SentinelPage() {
  const scenarios = SENTINEL_SCENARIOS.map(publicScenario);
  const evalSummary = runDeterministicSafetyEvals();
  const liveConfigured = Boolean(process.env.OPENAI_API_KEY);

  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Flagship project · Sentinel</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[80px] lg:leading-[0.98]">When production breaks, Sentinel investigates what changed and why.</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--muted)] md:text-xl">This project models a real on-call problem: an application starts failing, but nobody knows whether the cause is the database, a deployment, the network, authentication, a data contract, or something else. Sentinel gathers evidence, forms a diagnosis, recommends a safe next step, and stops for human approval when the action could affect production.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#demo" className="btn-primary rounded-full px-5">Try the incident demo ↓</a><a href="#how-it-works" className="btn-secondary">How it works</a><Link href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/sentinel" target="_blank" className="btn-secondary">Source ↗</Link></div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Start with the problem</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {[
              ["1", "Something breaks", "Example: checkout failures jump from 0.2% to 17% after a release."],
              ["2", "The cause is unknown", "The database, application, network, configuration, or deployment could all be responsible."],
              ["3", "Evidence lives in different places", "Metrics, logs, deployments, code changes, runbooks, database health, and past incidents each tell part of the story."],
              ["4", "A decision has operational risk", "Even a correct diagnosis does not mean an AI model should be allowed to restart or roll back production on its own."],
            ].map(([number, title, body]) => <article key={number} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><span className="font-mono text-xs text-[var(--signal)]">{number}</span><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section id="demo" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1480px] px-5 py-20 md:px-8 md:py-24">
          <div className="mb-10 max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Interactive demo</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">Pick a failure. See how Sentinel reasons through it.</h2>
            <p className="mt-5 text-base leading-7 text-[var(--muted)]">You do not need incident-response experience to use this. Each scenario first explains what broke, what a human engineer would normally investigate, and what Sentinel is expected to figure out. Only then does the technical trace appear.</p>
          </div>
          <SentinelConsole scenarios={scenarios} liveConfigured={liveConfigured} evalSummary={evalSummary} />
        </div>
      </section>

      <section id="how-it-works" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">What is actually happening</p>
          <h2 className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">The model investigates. The platform controls what the model is allowed to do.</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)]">The live model does not receive a magical “fix production” capability. It gets a small set of read-only investigation tools. After it has enough evidence, it can propose a remediation. Separate deterministic code checks permissions and risk before anything happens.</p>

          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {architecture.map(([number, title, body]) => <article key={number} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><div className="flex items-center justify-between"><span className="font-mono text-xs text-[var(--signal)]">{number}</span><span className="text-[var(--muted)]">→</span></div><h3 className="mt-7 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">The tool surface</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Eight things the agent can inspect.</h2>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">These tools represent the systems an on-call engineer commonly checks. They are intentionally narrow. The agent cannot run an arbitrary shell command or arbitrary production SQL.</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]">
              {TOOL_DEFINITIONS.map((tool) => <div key={tool.name} className="grid gap-2 border-b border-[var(--line)] px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"><div><code className="text-sm font-semibold">{tool.name}()</code><p className="mt-1 text-xs text-[var(--muted)]">{tool.purpose}</p></div><span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px]">{tool.risk} risk · {tool.permission}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl bg-[var(--ink)] p-7 text-white md:p-9">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">Safety design</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">A correct model answer is not the same thing as authorization.</h2>
              <div className="mt-7 space-y-4 text-sm leading-6 text-white/75">
                <p>Logs and tool output are treated as data, not instructions.</p>
                <p>Unknown actions are denied by default.</p>
                <p>High-risk production actions require a human.</p>
                <p>The public demo only modifies simulated state.</p>
              </div>
            </article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Measured safety behavior</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">The repo tests the controls, not just the happy path.</h2>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.policyPasses}/{evalSummary.totalCases}</p><p className="mt-1 text-xs text-[var(--muted)]">policy cases passed</p></div>
                <div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.toolSchemaCoverage}%</p><p className="mt-1 text-xs text-[var(--muted)]">tool contract coverage</p></div>
                <div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.approvalBypasses}</p><p className="mt-1 text-xs text-[var(--muted)]">approval bypasses</p></div>
                <div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-3xl font-semibold">{evalSummary.injectionDetected}/{evalSummary.injectionCases}</p><p className="mt-1 text-xs text-[var(--muted)]">injection fixtures detected</p></div>
              </div>
              <p className="mt-5 text-xs leading-5 text-[var(--muted)]">These are deterministic governance metrics. Live-model diagnosis quality is a separate evaluation problem and should not be represented by invented accuracy numbers.</p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Implementation depth</p>
          <h2 className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] md:text-6xl">The web demo is the easiest way in. The repo goes much deeper.</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)]">The Sentinel directory contains a FastAPI service, MCP server, PostgreSQL/pgvector schema, Docker Compose environment, simulator fixtures, security and evaluation tests, architecture documentation, and Terraform reference infrastructure.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/sentinel" target="_blank" className="btn-primary rounded-full px-5">Inspect Sentinel source ↗</Link><Link href="/" className="btn-secondary">Back to portfolio</Link></div>
        </div>
      </section>
    </main>
  );
}
