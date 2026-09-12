import Link from "next/link";
import { FieldGuideConsole } from "@/components/fieldguide-console";
import { ProjectHowItWorks } from "@/components/project-how-it-works";

export const metadata = {
  title: "FieldGuide — Enterprise AI Deployment Workbench",
  description: "A working deployment-strategy lab for turning messy enterprise workflows into governed agent runbooks, eval gates, and sequenced production rollouts.",
};

const stack = [
  {
    label: "Live in the public project",
    items: ["Next.js 16", "React 19", "TypeScript", "OpenAI Responses API", "Hugging Face open-model fallback", "Structured strategy synthesis", "Deterministic policy engine", "Golden-set evals", "Fault injection", "Production CI"],
  },
  {
    label: "Enterprise patterns implemented",
    items: ["Step-level model routing", "Per-action authorization", "Human approval gates", "Prompt-injection handling", "Append-only trace design", "Synthetic connector graph", "Deployment-mode planning", "Rollback-first rollout"],
  },
  {
    label: "Production reference architecture",
    items: ["MCP", "Temporal / durable workflows", "OpenTelemetry", "OPA / policy-as-code", "Customer VPC", "Kubernetes", "Terraform", "Secrets brokering", "SIEM export"],
  },
];

export default function FieldGuidePage() {
  return (
    <main>
      <section className="border-b border-[var(--line)] bg-[#0d1618] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
            <span className="rounded-full border border-[#b8ff5b]/35 bg-[#b8ff5b]/10 px-3 py-1.5 text-[#b8ff5b]">Deployment strategy flagship</span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">Enterprise agents</span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">Evals + governance</span>
          </div>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.17em] text-[#b8ff5b]">FieldGuide</p>
              <h1 className="mt-4 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] md:text-7xl">
                Turn a messy workflow into an AI deployment you can defend.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-white/62">
                Enterprise AI usually fails before the model call: the wrong workflow is chosen, the source of truth is unclear,
                permissions are hand-waved, exceptions are ignored, or nobody defines what “good” means. FieldGuide is a working
                deployment-strategy lab that maps those decisions before autonomy expands.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#workbench" className="inline-flex items-center justify-center rounded-full bg-[#b8ff5b] px-5 py-3 text-sm font-black text-[#0d1618]">Open the workbench ↓</a>
                <a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/fieldguide" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">Architecture + playbook ↗</a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">The deployment strategist loop</p>
              <div className="mt-5 space-y-3">
                {[
                  ["01", "Discover", "Map operators, systems, bottlenecks, exceptions, and the real decision boundary."],
                  ["02", "Sequence", "Choose the first workflow by value, readiness, reversibility, sponsor strength, and risk."],
                  ["03", "Configure", "Turn workflow knowledge into a runbook with tools, identity, models, policy, and human gates."],
                  ["04", "Pilot + evaluate", "Replay representative cases, inject failures, score hard controls, and capture expert corrections."],
                  ["05", "Roll out", "Move from shadow → assisted → bounded automation only when quality and operating gates clear."],
                ].map(([num, title, body]) => (
                  <div key={num} className="grid grid-cols-[44px_1fr] gap-3 rounded-2xl bg-black/20 p-4">
                    <span className="font-mono text-xs text-[#b8ff5b]">{num}</span>
                    <div><p className="font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-white/45">{body}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workbench" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <FieldGuideConsole />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Why this exists</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">The hard part is deployment, not prompting.</h2>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
                A credible enterprise pilot has to answer several questions at once: which workflow is worth automating first,
                what the operator is still responsible for, which system is authoritative, what the agent may read versus change,
                how quality is measured, what happens when a provider or worker fails, and how the rollout creates trust instead of
                forcing a big-bang launch.
              </p>
            </div>

            <ProjectHowItWorks
              steps={[
                { title: "Start with the operator", body: "Capture the actual job, handoffs, exceptions, and failure cost before proposing an agent." },
                { title: "Pick the reversible wedge", body: "Score opportunities on value and readiness, but penalize irreversibility and risk so the first pilot learns quickly." },
                { title: "Separate reasoning from authority", body: "Models may synthesize and recommend; deterministic policy, identity, and named humans own consequential actions." },
                { title: "Make quality executable", body: "Golden cases cover happy path, high-risk, conflicting evidence, and prompt-injection slices; regressions block promotion." },
                { title: "Expand cohort before authority", body: "Shadow mode comes first, then assisted production, then bounded write automation after evidence supports it." },
              ]}
              toolGroups={stack.map((group) => ({ label: group.label, items: group.items }))}
              note="The public demo uses synthetic enterprise data. Reference infrastructure is labeled separately rather than presented as if it were running inside Vercel."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">01 · Strategy</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Workflow economics before model selection.</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">FieldGuide explicitly ranks opportunities using business value, frequency, standardization, data readiness, reversibility, sponsor readiness, and risk. “Most autonomous” is not the objective function.</p>
            </article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">02 · Systems</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Control plane outside the model.</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Identity, permissions, human approvals, tool boundaries, checkpoints, and write authority are explicit. A prompt cannot grant itself more access, and an untrusted document cannot become an instruction channel.</p>
            </article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">03 · Adoption</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">A rollout is an operating-model change.</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">The plan names the sponsor, operator owner, security/IT boundary, engineering responsibility, launch gates, and measurable 30/60/90 outcomes. Feedback becomes eval data instead of disappearing into Slack.</p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Reliability contract</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Test the failure modes, not only the happy demo.</h2>
                <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
                  FieldGuide has deterministic golden-set gates, provider retry/fallback behavior, malformed-input validation,
                  prompt-injection fixtures, failure-injection replay, public-page rendering checks, concurrent API stress, TypeScript
                  compilation, production build validation, and deployed-production smoke tests. The suite distinguishes hard-control
                  correctness from stochastic model quality so a green safety gate is never mislabeled as “100% AI accuracy.”
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Golden cases", "High-risk, conflicting evidence, prompt injection, happy path"],
                  ["Fault injection", "Worker interruption + checkpoint resume"],
                  ["Provider failure", "Retry + deterministic fallback, no raw 429 crash"],
                  ["Security", "No model-owned write authorization"],
                  ["Stress", "Concurrent strategy requests + page rendering"],
                  ["Production", "CI waits for the deployed commit, then smoke-tests it"],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl bg-[var(--soft)] p-4">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/projects" className="btn-secondary">All projects</Link>
            <Link href="/projects/evaluations" className="btn-secondary">Evaluation methodology</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
