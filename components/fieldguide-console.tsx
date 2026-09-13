"use client";

import { useMemo, useState } from "react";
import {
  buildPilotTrace,
  chooseFirstPilot,
  evaluateScenario,
  executiveBriefFor,
  modelRoutingPlan,
  rankOpportunities,
  rolloutFor,
  type PilotTraceItem,
} from "@/lib/fieldguide/engine";
import {
  deploymentModes,
  fieldGuideScenarios,
  type DeploymentMode,
} from "@/lib/fieldguide/scenarios";

type StrategyBrief = {
  executiveSummary: string;
  hiddenPainPoints: string[];
  firstPilot: { name: string; why: string; boundary: string };
  deploymentSequence: string[];
  stakeholderPlan: string[];
  launchGates: string[];
  questions: string[];
};

type Tab = "discover" | "design" | "pilot" | "evals" | "rollout" | "manage" | "custom";

const tabs: Array<{ id: Tab; label: string; detail: string }> = [
  { id: "discover", label: "01 Discover", detail: "Workflow + pain" },
  { id: "design", label: "02 Design", detail: "Prioritize + runbook" },
  { id: "pilot", label: "03 Pilot", detail: "Trace + controls" },
  { id: "evals", label: "04 Evals", detail: "Golden set" },
  { id: "rollout", label: "05 Rollout", detail: "30 / 60 / 90" },
  { id: "manage", label: "06 Manage", detail: "Owner + gates" },
  { id: "custom", label: "07 Your workflow", detail: "Live strategy" },
];

const kindLabel: Record<string, string> = {
  context: "Context",
  tool: "Tool",
  model: "Model",
  policy: "Policy",
  human: "Human",
  write: "Write",
  fault: "Fault",
  recovery: "Recovery",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-[#b8ff5b]" style={{ width: `${value}%` }} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-white">{value}</p>
    </div>
  );
}

export function FieldGuideConsole() {
  const [scenarioId, setScenarioId] = useState(fieldGuideScenarios[0].id);
  const [mode, setMode] = useState<DeploymentMode>("vpc");
  const [tab, setTab] = useState<Tab>("discover");
  const [trace, setTrace] = useState<PilotTraceItem[]>([]);
  const [running, setRunning] = useState(false);
  const [injectFailure, setInjectFailure] = useState(true);
  const [evalResult, setEvalResult] = useState<ReturnType<typeof evaluateScenario> | null>(null);
  const [review, setReview] = useState<"accepted" | "corrected" | null>(null);
  const [custom, setCustom] = useState(
    "Our analysts review customer escalations across ServiceNow, SharePoint policy documents, Snowflake account history, and Slack. They spend hours rebuilding context before deciding whether an exception is allowed. High-risk exceptions need a director to approve them, and the final disposition is written back to ServiceNow.",
  );
  const [customLive, setCustomLive] = useState(true);
  const [brief, setBrief] = useState<StrategyBrief | null>(null);
  const [briefMeta, setBriefMeta] = useState<{ model: string; latencyMs: number; degraded: boolean } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [activePhase, setActivePhase] = useState<"shadow" | "assisted" | "bounded">("shadow");

  const scenario = useMemo(
    () => fieldGuideScenarios.find((item) => item.id === scenarioId) ?? fieldGuideScenarios[0],
    [scenarioId],
  );
  const ranked = useMemo(() => rankOpportunities(scenario), [scenario]);
  const firstPilot = useMemo(() => chooseFirstPilot(scenario), [scenario]);
  const routing = useMemo(() => modelRoutingPlan(scenario), [scenario]);
  const rollout = useMemo(() => rolloutFor(scenario, mode), [scenario, mode]);
  const defaultBrief = useMemo(() => executiveBriefFor(scenario, mode), [scenario, mode]);

  function changeScenario(id: string) {
    setScenarioId(id);
    setTrace([]);
    setEvalResult(null);
    setReview(null);
    setBrief(null);
    setError("");
    setActivePhase("shadow");
  }

  async function runPilot() {
    if (running) return;
    setRunning(true);
    setTrace([]);
    setReview(null);
    const full = buildPilotTrace(scenario, injectFailure);
    for (const item of full) {
      setTrace((current) => [...current, item]);
      await delay(item.kind === "fault" ? 650 : 280);
    }
    setRunning(false);
  }

  async function runEvals() {
    setEvalResult(null);
    await delay(250);
    setEvalResult(evaluateScenario(scenario));
  }

  async function analyzeCustom() {
    setAnalyzing(true);
    setError("");
    setBrief(null);
    setBriefMeta(null);
    try {
      const response = await fetch("/api/fieldguide/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          deploymentMode: mode,
          workflowDescription: custom,
          live: customLive,
        }),
      });
      const data = await response.json() as {
        error?: string;
        brief?: StrategyBrief;
        model?: string;
        metrics?: { latencyMs?: number; degraded?: boolean };
      };
      if (!response.ok || !data.brief) throw new Error(data.error || "Unable to analyze this workflow.");
      setBrief(data.brief);
      setBriefMeta({
        model: data.model || "strategy engine",
        latencyMs: Number(data.metrics?.latencyMs ?? 0),
        degraded: Boolean(data.metrics?.degraded),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to analyze this workflow.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#2e3b3e] bg-[#0d1618] text-white shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 bg-[#111d20] px-5 py-5 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b8ff5b]">
              <span className="h-2 w-2 rounded-full bg-[#b8ff5b]" />
              {scenario.publicSource ? "Deployment workbench · public-source reconstruction" : "Deployment workbench · synthetic enterprise data"}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-3xl">{scenario.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">{scenario.oneLiner}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fieldGuideScenarios.map((item) => (
              <button
                key={item.id}
                onClick={() => changeScenario(item.id)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition ${scenario.id === item.id ? "border-[#b8ff5b]/60 bg-[#b8ff5b]/10 text-white" : "border-white/10 bg-white/[0.025] text-white/55 hover:bg-white/[0.06]"}`}
              >
                <span className="block font-semibold">{item.vertical}</span>
                <span className="mt-0.5 block text-[10px] opacity-65">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
        {scenario.publicSource ? (
          <div className="mt-5 rounded-2xl border border-[#7dd3fc]/25 bg-[#7dd3fc]/[0.055] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">Real-world public case · sourced</p>
                <p className="mt-1 text-sm font-semibold">{scenario.publicSource.organization}</p>
                <p className="mt-2 max-w-4xl text-[11px] leading-5 text-white/48">{scenario.publicSource.note}</p>
              </div>
              <a href={scenario.publicSource.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-[#7dd3fc]/30 px-3 py-2 text-[10px] font-semibold text-[#b9e8ff]">Open public source ↗</a>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-b border-white/10 bg-black/10 px-3 py-3 md:px-6">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-3 py-2.5 text-left transition ${tab === item.id ? "bg-white text-[#0d1618]" : "bg-white/[0.035] text-white/60 hover:bg-white/[0.07]"}`}
            >
              <span className="block text-[11px] font-bold">{item.label}</span>
              <span className="mt-0.5 block text-[10px] opacity-60">{item.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 md:p-8">
        {tab === "discover" && (
          <div className="space-y-7">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Current volume" value={scenario.baseline.volume} />
              <Metric label="Current cycle time" value={scenario.baseline.cycleTime} />
              <Metric label="Manual friction" value={scenario.baseline.manualTouches} />
              <Metric label="Cost of failure" value={scenario.baseline.failureCost} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">What discovery reveals</p>
                <h3 className="mt-2 text-xl font-semibold">The hidden workflow is usually the deployment.</h3>
                <div className="mt-5 space-y-3">
                  {scenario.painPoints.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-xl bg-black/20 p-3.5 text-sm leading-6 text-white/70">
                      <span className="font-mono text-[11px] text-[#b8ff5b]">0{index + 1}</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">System map</p>
                <div className="mt-4 space-y-3">
                  {scenario.systems.map((system) => (
                    <div key={system.name} className="rounded-xl border border-white/8 bg-black/15 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{system.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">{system.category}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/55">{system.access}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-white/50">{system.purpose}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="rounded-2xl border border-[#b8ff5b]/20 bg-[#b8ff5b]/[0.055] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">Deployment objective</p>
              <p className="mt-2 max-w-4xl text-base leading-7 text-white/80">{scenario.objective}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="rounded-full bg-black/20 px-3 py-1.5">Sponsor · {scenario.sponsor}</span>
                <span className="rounded-full bg-black/20 px-3 py-1.5">Operator · {scenario.operator}</span>
              </div>
            </div>

            {scenario.publicSource ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">What is sourced vs. proposed</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-black/20 p-4">
                    <p className="text-xs font-semibold">Publicly documented facts</p>
                    {scenario.publicSource.facts.map((fact) => <p key={fact} className="mt-2 text-[10px] leading-5 text-white/48">✓ {fact}</p>)}
                  </div>
                  <div className="rounded-xl bg-black/20 p-4">
                    <p className="text-xs font-semibold">FieldGuide proposal</p>
                    <p className="mt-2 text-[10px] leading-5 text-white/48">The agent runbook, model routing, approval boundaries, evaluation set, rollout phases, and proposed supporting-evidence connector are a deployment hypothesis — not claims about Cleveland Clinic's internal implementation.</p>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}

        {tab === "design" && (
          <div className="space-y-7">
            <section>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">Opportunity sequencing</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Automate the best learning loop first.</h3>
                </div>
                <p className="max-w-xl text-xs leading-5 text-white/45">Score combines business value, frequency, standardization, data readiness, reversibility, sponsor readiness, and risk. High-risk writeback does not win just because it saves more clicks.</p>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                {ranked.map((item, index) => (
                  <article key={item.id} className={`rounded-2xl border p-5 ${index === 0 ? "border-[#b8ff5b]/35 bg-[#b8ff5b]/[0.055]" : "border-white/10 bg-white/[0.025]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">Wave {index + 1}</p>
                        <h4 className="mt-1 font-semibold">{item.name}</h4>
                      </div>
                      <span className="text-2xl font-semibold">{item.score}</span>
                    </div>
                    <div className="mt-3"><ScoreBar value={item.score} /></div>
                    <p className="mt-4 text-xs leading-5 text-white/55">{item.outcome}</p>
                    <p className="mt-3 border-t border-white/8 pt-3 text-[11px] leading-5 text-white/40">{item.rationale}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">Runbook</p>
                  <h3 className="mt-1 text-xl font-semibold">Control-plane decisions stay outside model authority.</h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/50">{scenario.runbook.length} governed steps</span>
              </div>
              <div className="mt-5 space-y-2">
                {scenario.runbook.map((step, index) => (
                  <div key={step.id} className="grid gap-3 rounded-xl border border-white/8 bg-black/15 p-4 md:grid-cols-[52px_1fr_160px] md:items-center">
                    <div className="font-mono text-xs text-white/30">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{step.label}</p>
                        <span className="rounded-full bg-white/7 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/45">{kindLabel[step.kind]}</span>
                        {step.system ? <span className="text-[10px] text-[#7dd3fc]">{step.system}</span> : null}
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-white/48">{step.detail}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-white/35">{step.model === "gpt-5.6-terra" ? "frontier reasoning" : step.model === "gpt-5.6-luna" ? "fast model" : "deterministic"}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#b8ff5b]">{step.permission === "write" ? "write after gate" : step.permission}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              {routing.slice(0, 3).map((item) => (
                <div key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">{item.route}</p>
                  <p className="mt-1.5 text-sm font-semibold">{item.step}</p>
                  <p className="mt-2 text-[11px] leading-5 text-white/45">{item.why}</p>
                </div>
              ))}
            </section>
          </div>
        )}

        {tab === "pilot" && (
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <section>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">{scenario.publicSource ? "Public-source deployment scenario" : "Synthetic historical case"}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{scenario.pilotCase.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">{scenario.pilotCase.brief}</p>
              <div className="mt-5 space-y-2">
                {scenario.pilotCase.facts.map((fact) => (
                  <div key={fact} className="flex gap-2 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-xs leading-5 text-white/60">
                    <span className="text-[#7dd3fc]">↳</span><span>{fact}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={injectFailure} onChange={(event) => setInjectFailure(event.target.checked)} className="mt-1" />
                  <span>
                    <span className="block text-sm font-semibold">Inject a worker interruption</span>
                    <span className="mt-1 block text-xs leading-5 text-white/45">Prove the run can resume from a checkpoint instead of repeating completed work.</span>
                  </span>
                </label>
              </div>
              <button onClick={runPilot} disabled={running} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#b8ff5b] px-5 py-3 text-sm font-black text-[#0d1618] disabled:cursor-wait disabled:opacity-60">
                {running ? `Running · ${trace.length} events` : trace.length ? "Run pilot again" : "Run governed pilot →"}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#091012] p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
                <div>
                  <p className="text-xs font-semibold">Run trace</p>
                  <p className="mt-0.5 text-[10px] text-white/35">Every action, approval, failure, and recovery is inspectable.</p>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full ${running ? "animate-pulse bg-[#b8ff5b]" : trace.length ? "bg-[#7dd3fc]" : "bg-white/20"}`} />
              </div>
              <div className="mt-4 min-h-[360px] space-y-2">
                {!trace.length ? (
                  <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-dashed border-white/10 text-center text-xs leading-6 text-white/35">
                    Run the pilot to watch evidence gathering, model routing, policy checks, approval, and writeback.
                  </div>
                ) : trace.map((item) => (
                  <div key={item.id} className={`rounded-xl border p-3 ${item.kind === "fault" ? "border-[#ff9b7a]/30 bg-[#ff9b7a]/8" : item.kind === "recovery" ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/8" : item.kind === "human" ? "border-[#facc15]/25 bg-[#facc15]/[0.055]" : "border-white/8 bg-white/[0.025]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-white/30">cp {item.checkpoint}</span>
                        <p className="text-xs font-semibold">{item.label}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-[0.12em] text-white/35">{kindLabel[item.kind] || item.kind}</span>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-5 text-white/48">{item.detail}</p>
                  </div>
                ))}
              </div>

              {!running && trace.length > 0 ? (
                <div className="mt-4 rounded-xl border border-[#b8ff5b]/25 bg-[#b8ff5b]/[0.06] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#b8ff5b]">Pilot decision</p>
                  <p className="mt-2 text-sm font-semibold leading-6">{scenario.pilotCase.expectedDecision}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setReview("accepted")} className={`rounded-full px-3 py-2 text-xs font-semibold ${review === "accepted" ? "bg-[#b8ff5b] text-[#0d1618]" : "bg-white/8 text-white"}`}>Accept as expert-reviewed</button>
                    <button onClick={() => setReview("corrected")} className={`rounded-full px-3 py-2 text-xs font-semibold ${review === "corrected" ? "bg-[#7dd3fc] text-[#0d1618]" : "bg-white/8 text-white"}`}>Mark for correction</button>
                  </div>
                  {review ? <p className="mt-3 text-[10px] leading-5 text-white/45">{review === "accepted" ? "Accepted output becomes a candidate golden example. It still reruns the full eval set before any runbook/model change is promoted." : "Correction is captured as training/evaluation signal; the current runbook is not silently updated in production."}</p> : null}
                </div>
              ) : null}
            </section>
          </div>
        )}

        {tab === "evals" && (
          <div className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">Release gate</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">A demo is not a deployment until regressions can block it.</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">The public demo keeps deterministic safety/authority tests separate from semantic model quality. A perfect policy score does not mean the model is “100% accurate.” It means the specific hard controls passed.</p>
                <button onClick={runEvals} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0d1618]">Run golden-set gates →</button>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                {(evalResult?.results ?? scenario.goldenCases.map((item) => ({ id: item.id, title: item.title, slice: item.slice, passed: false, checks: [] }))).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/7 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-white/40">{item.slice}</span>
                      <span className={`text-[10px] font-bold ${evalResult ? item.passed ? "text-[#b8ff5b]" : "text-[#ff9b7a]" : "text-white/25"}`}>{evalResult ? item.passed ? "PASS" : "BLOCK" : "NOT RUN"}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{item.title}</p>
                    {evalResult ? <div className="mt-3 space-y-1.5">{item.checks.map((check) => <p key={check.name} className="text-[10px] leading-4 text-white/42"><span className={check.passed ? "text-[#b8ff5b]" : "text-[#ff9b7a]"}>{check.passed ? "✓" : "×"}</span> {check.name}</p>)}</div> : null}
                  </article>
                ))}
              </section>
            </div>

            {evalResult ? (
              <div className={`rounded-2xl border p-5 ${evalResult.summary.launchBlocked ? "border-[#ff9b7a]/30 bg-[#ff9b7a]/7" : "border-[#b8ff5b]/30 bg-[#b8ff5b]/[0.055]"}`}>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Metric label="Deterministic gates" value={`${evalResult.summary.passed} / ${evalResult.summary.total}`} />
                  <Metric label="Policy pass rate" value={`${evalResult.summary.deterministicPassRate}%`} />
                  <Metric label="Approval slices" value={String(evalResult.summary.approvalCases)} />
                  <Metric label="Injection slices" value={String(evalResult.summary.injectionCases)} />
                </div>
                <p className="mt-4 text-xs leading-5 text-white/50">{evalResult.summary.launchBlocked ? "Launch blocked: at least one hard control failed." : "Hard-control suite passes. Semantic quality would still need repeated model trials plus calibrated expert review before expanding authority."}</p>
              </div>
            ) : null}
          </div>
        )}

        {tab === "rollout" && (
          <div className="space-y-7">
            <section>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">Deployment perimeter</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(Object.keys(deploymentModes) as DeploymentMode[]).map((id) => (
                  <button key={id} onClick={() => setMode(id)} className={`rounded-2xl border p-4 text-left transition ${mode === id ? "border-[#b8ff5b]/40 bg-[#b8ff5b]/[0.055]" : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"}`}>
                    <p className="text-sm font-semibold">{deploymentModes[id].label}</p>
                    <p className="mt-2 text-[10px] leading-5 text-white/42">{deploymentModes[id].tradeoff}</p>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-white/8 bg-black/15 p-4 text-xs leading-6 text-white/55">{deploymentModes[mode].boundary}</div>
            </section>

            <section className="grid gap-3 lg:grid-cols-3">
              {rollout.map((phase) => (
                <article key={phase.phase} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <p className="font-mono text-[10px] text-[#7dd3fc]">{phase.phase}</p>
                  <h3 className="mt-2 text-xl font-semibold">{phase.name}</h3>
                  <p className="mt-3 text-xs leading-5 text-white/50">{phase.outcome}</p>
                  <div className="mt-4 border-t border-white/8 pt-4">
                    {phase.gates.map((gate) => <p key={gate} className="mt-2 flex gap-2 text-[10px] leading-5 text-white/42"><span className="text-[#b8ff5b]">✓</span><span>{gate}</span></p>)}
                  </div>
                </article>
              ))}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">Stakeholder operating model</p>
                {defaultBrief.stakeholderPlan.map((item) => <p key={item} className="mt-3 text-xs leading-6 text-white/52">↳ {item}</p>)}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">First pilot</p>
                <p className="mt-2 text-lg font-semibold">{firstPilot.name}</p>
                <p className="mt-3 text-xs leading-6 text-white/50">{firstPilot.rationale}</p>
                <p className="mt-4 rounded-xl bg-black/20 p-3 text-[11px] leading-5 text-white/45">Sequence authority after evidence. The first release should learn the workflow and quality bar, not maximize autonomy.</p>
              </div>
            </section>
          </div>
        )}

        {tab === "manage" && (
          <div className="space-y-7">
            <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">Deployment control center</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">One screen for the owner, stage, gates, and next action.</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">This is the operator-facing management layer: it keeps the project understandable without asking someone to inspect traces, prompts, or infrastructure to know what happens next.</p>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {[
                    ["shadow", "Shadow", "Observe beside experts"],
                    ["assisted", "Assisted", "Human-reviewed production"],
                    ["bounded", "Bounded", "Low-risk automation"],
                  ].map(([id, label, detail]) => (
                    <button key={id} onClick={() => setActivePhase(id as "shadow" | "assisted" | "bounded")} className={`rounded-xl border p-3 text-left transition ${activePhase === id ? "border-[#b8ff5b]/40 bg-[#b8ff5b]/[0.06]" : "border-white/10 bg-white/[0.025]"}`}>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="mt-1 text-[9px] leading-4 text-white/35">{detail}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7dd3fc]">Next best action</p>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    {!trace.length
                      ? "Run the historical pilot and inspect the governed trace."
                      : !review
                        ? "Capture an expert accept/correct decision on the pilot output."
                        : !evalResult
                          ? "Run the golden-set release gates before promoting a change."
                          : evalResult.summary.launchBlocked
                            ? "Keep the deployment blocked and fix the failing hard-control case."
                            : activePhase === "shadow"
                              ? "Quality gates are clear for a shadow-mode rollout review."
                              : activePhase === "assisted"
                                ? "Review operator acceptance and overrides before expanding the cohort."
                                : "Keep automation bounded to low-risk, reversible actions and rerun evals on every change."}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#091012] p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Business owner" value={scenario.sponsor} />
                  <Metric label="Operator owner" value={scenario.operator} />
                  <Metric label="Perimeter" value={deploymentModes[mode].label} />
                  <Metric label="First pilot" value={firstPilot.name} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[
                    ["Workflow mapped", true, "Systems, pain points, and decision boundary are defined."],
                    ["Pilot selected", Boolean(firstPilot), firstPilot.rationale],
                    ["Historical replay", trace.length > 0, trace.length ? `${trace.length} trace events captured.` : "Run the pilot from the Pilot tab."],
                    ["Expert review", Boolean(review), review ? `Review state: ${review}.` : "Awaiting expert accept/correct signal."],
                    ["Golden-set gate", Boolean(evalResult && !evalResult.summary.launchBlocked), evalResult ? `${evalResult.summary.passed}/${evalResult.summary.total} hard-control cases passed.` : "Golden set has not been run in this session."],
                    ["Deployment plan", true, `${rollout.length} rollout phases defined for ${deploymentModes[mode].label}.`],
                  ].map(([title, done, detail]) => (
                    <div key={String(title)} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold">{String(title)}</p>
                        <span className={`text-[10px] font-bold ${done ? "text-[#b8ff5b]" : "text-[#facc15]"}`}>{done ? "READY" : "TODO"}</span>
                      </div>
                      <p className="mt-2 text-[10px] leading-5 text-white/40">{String(detail)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => setTab("pilot")} className="rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#0d1618]">Open pilot</button>
                  <button onClick={() => setTab("evals")} className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-semibold">Open evals</button>
                  <button onClick={() => setTab("rollout")} className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-semibold">Open rollout</button>
                </div>
              </section>
            </div>

            {scenario.publicSource ? (
              <section className="rounded-2xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.045] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">Example management story · {scenario.publicSource.organization}</p>
                <p className="mt-3 text-sm leading-7 text-white/65">A deployment strategist can select this case, see the documented ServiceNow + SecurityScorecard workflow, choose evidence assembly as the reversible first wedge, run the deterioration scenario, collect an expert decision, run the four hard-control cases, choose the customer-VPC perimeter, and then return here to see exactly what is ready and what is still blocking promotion. The workflow stays legible to the business owner even though the implementation underneath includes models, tools, policy, and durable execution.</p>
              </section>
            ) : null}
          </div>
        )}

        {tab === "custom" && (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <section>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8ff5b]">Bring your own workflow</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Describe messy reality, not an AI use case.</h3>
              <p className="mt-3 text-sm leading-6 text-white/50">Include people, systems, handoffs, approvals, exceptions, and what actually hurts. FieldGuide turns that into a first-pilot hypothesis and deployment questions.</p>
              <textarea value={custom} onChange={(event) => setCustom(event.target.value)} rows={11} maxLength={6000} className="mt-5 w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-[#b8ff5b]/45" />
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3">
                <input id="fieldguide-live" type="checkbox" checked={customLive} onChange={(event) => setCustomLive(event.target.checked)} className="mt-1" />
                <label htmlFor="fieldguide-live" className="cursor-pointer text-xs leading-5 text-white/50"><span className="font-semibold text-white/75">Use live model synthesis</span><br />OpenAI is used only for the strategy narrative. Hard policy, scoring, and eval gates remain deterministic. If the provider is unavailable, the endpoint returns a deterministic brief instead of breaking.</label>
              </div>
              <button onClick={analyzeCustom} disabled={analyzing || custom.trim().length < 80} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#b8ff5b] px-5 py-3 text-sm font-black text-[#0d1618] disabled:cursor-not-allowed disabled:opacity-40">
                {analyzing ? "Mapping workflow…" : "Build deployment hypothesis →"}
              </button>
              {error ? <p className="mt-3 rounded-xl border border-[#ff9b7a]/25 bg-[#ff9b7a]/8 p-3 text-xs text-[#ffb39d]">{error}</p> : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#091012] p-5">
              {!brief ? (
                <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <div>
                    <p className="text-sm font-semibold text-white/55">No custom deployment hypothesis yet.</p>
                    <p className="mt-2 max-w-md text-xs leading-6 text-white/30">The output is intentionally a hypothesis, not fabricated “customer discovery.” It gives you what to validate next with real operators and stakeholders.</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                    <div><p className="text-[10px] uppercase tracking-[0.13em] text-white/30">Deployment hypothesis</p><p className="mt-1 text-xs text-white/55">{briefMeta?.model}</p></div>
                    <div className="flex gap-2 text-[9px] text-white/35">
                      <span>{briefMeta?.latencyMs ?? 0} ms</span>
                      <span>·</span>
                      <span>{briefMeta?.degraded ? "fallback used" : "full path"}</span>
                    </div>
                  </div>
                  <p className="mt-5 text-lg font-semibold leading-7">{brief.executiveSummary}</p>
                  <div className="mt-5 rounded-xl border border-[#b8ff5b]/20 bg-[#b8ff5b]/[0.055] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#b8ff5b]">First pilot</p>
                    <p className="mt-2 text-sm font-semibold">{brief.firstPilot.name}</p>
                    <p className="mt-2 text-xs leading-5 text-white/50">{brief.firstPilot.why}</p>
                    <p className="mt-2 text-[10px] leading-5 text-white/38">Boundary: {brief.firstPilot.boundary}</p>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7dd3fc]">Hidden pain</p>
                      {brief.hiddenPainPoints.map((item) => <p key={item} className="mt-2 text-[10px] leading-5 text-white/45">↳ {item}</p>)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7dd3fc]">Discovery questions</p>
                      {brief.questions.map((item) => <p key={item} className="mt-2 text-[10px] leading-5 text-white/45">↳ {item}</p>)}
                    </div>
                  </div>
                  <div className="mt-5 border-t border-white/8 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#b8ff5b]">Launch gates</p>
                    {brief.launchGates.map((item) => <p key={item} className="mt-2 text-[10px] leading-5 text-white/45">✓ {item}</p>)}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
