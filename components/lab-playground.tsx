"use client";

import { useMemo, useState } from "react";
import { labs, type LabSlug } from "@/lib/site";

type TraceStep = { tool: string; purpose: string; status: "ok" | "guarded"; detail: string; output?: string };
type RunResult = {
  headline: string;
  summary: string;
  trace: TraceStep[];
  evidence: string[];
  metrics: Array<[string, string]>;
  reasoning: string[];
  skills: string[];
  mode: string;
  serverLatencyMs: number;
  executedAt: string;
};

const prompts: Record<LabSlug, string[]> = {
  "context-ops": [
    "Can everyone access the Q3 pricing playbook?",
    "What changed in the onboarding policy and who owns it?",
    "Create a launch workflow for a new sales hire.",
  ],
  "solution-architect": [
    "A 1,500-person support org wants an AI agent to cut ticket handle time.",
    "A bank wants RAG over policy documents with strict permissions.",
    "A sales team wants an AI copilot but cannot quantify ROI yet.",
  ],
  "incident-commander": [
    "RAG answer quality dropped after yesterday's content sync.",
    "Agent latency doubled but model latency is unchanged.",
    "A tool-writing agent created duplicate tickets.",
  ],
};

export function LabPlayground({ slug }: { slug: LabSlug }) {
  const lab = useMemo(() => labs.find((item) => item.slug === slug)!, [slug]);
  const [scenario, setScenario] = useState(prompts[slug][0]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/labs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, scenario }),
      });
      if (!response.ok) throw new Error("The lab runtime returned an error.");
      setResult((await response.json()) as RunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run the workflow.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-[var(--line)] p-5 lg:border-b-0 lg:border-r lg:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Working server lab</p>
            <span className="rounded-full bg-[var(--signal-soft)] px-2.5 py-1 font-mono text-[10px] text-[var(--signal)]">NO PAID API</span>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What this agent actually does</p>
            <p className="mt-3 text-sm leading-6">{lab.problem}</p>
            <ol className="mt-4 space-y-2 text-xs leading-5 text-[var(--muted)]">
              {lab.workflow.map((step, index) => <li key={step}><span className="mr-2 font-mono text-[var(--signal)]">0{index + 1}</span>{step}</li>)}
            </ol>
          </div>

          <label htmlFor={`scenario-${slug}`} className="mt-6 block text-sm font-semibold">Scenario</label>
          <select id={`scenario-${slug}`} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-sm text-[var(--ink)] outline-none" value={scenario} onChange={(e) => setScenario(e.target.value)}>
            {prompts[slug].map((p) => <option key={p}>{p}</option>)}
          </select>
          <button type="button" onClick={run} disabled={loading} className="btn-primary mt-4 w-full disabled:cursor-wait disabled:opacity-60">{loading ? "Running workflow…" : "Run workflow"}</button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Skills demonstrated</p>
            <div className="mt-3 flex flex-wrap gap-2">{lab.skills.map((skill) => <span key={skill} className="rounded-full bg-[var(--soft)] px-3 py-1.5 text-xs">{skill}</span>)}</div>
          </div>
        </div>

        <div className="p-5 lg:p-7">
          {!result ? (
            <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center">
              <div className="max-w-md">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Ready to execute</p>
                <h3 className="mt-4 text-2xl font-semibold">Choose a scenario and run it.</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">The result below is produced by a server-side workflow, not a hidden prewritten card. You will see the tools called, why each tool exists, the evidence used, and the measured output.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Live run result</p>
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px]">{result.mode} · {result.serverLatencyMs} ms</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{result.headline}</h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">{result.summary}</p>

              <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{result.metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--line)] p-3"><p className="font-mono text-sm font-semibold">{value}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{label}</p></div>)}</div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Execution trace</p>
                  <div className="mt-3 space-y-2">{result.trace.map((step, i) => <div key={`${step.tool}-${i}`} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4"><div className="flex items-center justify-between gap-3"><code className="text-xs font-semibold">{step.tool}</code><span className={`font-mono text-[10px] ${step.status === "guarded" ? "text-[var(--orange)]" : "text-[var(--green)]"}`}>{step.status === "guarded" ? "GUARDED" : "OK"}</span></div><p className="mt-2 text-xs font-medium">{step.purpose}</p><p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{step.detail}</p>{step.output && <pre className="code-scroll mt-3 overflow-x-auto rounded-lg bg-[var(--surface)] p-3 text-[10px] leading-5 text-[var(--muted)]">{step.output}</pre>}</div>)}</div>
                </div>

                <div className="space-y-6">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Decision logic</p><ol className="mt-3 space-y-2">{result.reasoning.map((step, i) => <li key={step} className="flex gap-3 text-xs leading-5"><span className="font-mono text-[var(--signal)]">0{i + 1}</span><span>{step}</span></li>)}</ol></div>
                  <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Evidence used</p><div className="mt-3 flex flex-wrap gap-2">{result.evidence.map((item, i) => <span key={item} className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs">[{i + 1}] {item}</span>)}</div></div>
                  <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Engineering surface</p><div className="mt-3 flex flex-wrap gap-2">{result.skills.map((skill) => <span key={skill} className="rounded-full bg-[var(--signal-soft)] px-3 py-1.5 text-xs text-[var(--signal)]">{skill}</span>)}</div></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
