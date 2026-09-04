"use client";

import { useMemo, useState } from "react";
import type { InvestigationResult, RemediationAction } from "@/lib/sentinel/types";

type ScenarioSummary = {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  severity: string;
  service: string;
  environment: string;
  category: string;
  detectedAt: string;
};

type EvalSummary = {
  totalCases: number;
  policyPasses: number;
  unsafeExecutions: number;
  approvalBypasses: number;
  injectionCases: number;
  injectionDetected: number;
  toolSchemaCoverage: number;
  scenarioCoverage: number;
};

type RecoveryResult = {
  status: string;
  simulated: boolean;
  action: RemediationAction;
  before: Record<string, number | string>;
  after: Record<string, number | string>;
  verification: string;
  postmortem: {
    incident: string;
    impact: string;
    rootCause: string;
    remediation: string;
    resolvedAt: string;
    preventiveActions: string[];
  };
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCost(value: number) {
  return value === 0 ? "$0.000000" : `$${value.toFixed(6)}`;
}

export function SentinelConsole({
  scenarios,
  liveConfigured,
  evalSummary,
}: {
  scenarios: ScenarioSummary[];
  liveConfigured: boolean;
  evalSummary: EvalSummary;
}) {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const [mode, setMode] = useState<"live" | "deterministic">(liveConfigured ? "live" : "deterministic");
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [recovery, setRecovery] = useState<RecoveryResult | null>(null);
  const [status, setStatus] = useState<"idle" | "investigating" | "remediating">("idle");
  const [error, setError] = useState("");
  const [rejected, setRejected] = useState(false);

  const scenario = useMemo(() => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0], [scenarioId, scenarios]);

  async function investigate() {
    setStatus("investigating");
    setError("");
    setRecovery(null);
    setRejected(false);
    try {
      const response = await fetch("/api/sentinel/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, mode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Investigation failed.");
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investigation failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function remediate() {
    if (!result) return;
    setStatus("remediating");
    setError("");
    try {
      const response = await fetch("/api/sentinel/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, action: result.diagnosis.remediation.action, approved: result.policy.requiresApproval }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Remediation failed.");
      setRecovery(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remediation failed.");
    } finally {
      setStatus("idle");
    }
  }

  if (!scenario) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Incident simulator</p>
              <h3 className="mt-2 text-xl font-semibold">Choose a failure to inject</h3>
            </div>
            <span className="rounded-full border border-[var(--line)] bg-[var(--soft)] px-3 py-1 text-[11px] font-medium">{scenarios.length} reproducible scenarios</span>
          </div>

          <label className="mt-6 block text-sm font-semibold" htmlFor="sentinel-scenario">Scenario</label>
          <select
            id="sentinel-scenario"
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-sm outline-none focus:border-[var(--signal)]"
            value={scenarioId}
            onChange={(event) => {
              setScenarioId(event.target.value);
              setResult(null);
              setRecovery(null);
              setRejected(false);
            }}
          >
            {scenarios.map((item) => <option key={item.id} value={item.id}>{item.incidentId} · {item.title}</option>)}
          </select>

          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px] font-semibold">{scenario.severity}</span>
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px]">{scenario.service}</span>
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px]">{scenario.environment}</span>
            </div>
            <p className="mt-4 text-base font-semibold leading-6">{scenario.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{scenario.description}</p>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Investigation engine</p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--soft)] p-1.5">
              <button
                type="button"
                aria-pressed={mode === "live"}
                disabled={!liveConfigured}
                onClick={() => setMode("live")}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === "live" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Live OpenAI
              </button>
              <button
                type="button"
                aria-pressed={mode === "deterministic"}
                onClick={() => setMode("deterministic")}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === "deterministic" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"}`}
              >
                Deterministic
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              {liveConfigured
                ? "Live mode lets the model decide which read-only tools to call next. Policy and remediation authority remain deterministic."
                : "Live model configuration is unavailable, so the same tool contracts run through the deterministic safety path."}
            </p>
          </div>

          <button type="button" onClick={investigate} disabled={status !== "idle"} className="btn-primary mt-6 w-full rounded-xl disabled:cursor-wait disabled:opacity-60">
            {status === "investigating" ? "Investigating…" : `Investigate ${scenario.incidentId}`}
          </button>
          {error && <div role="alert" className="mt-4 rounded-xl border border-[var(--orange)]/30 bg-[var(--soft)] p-3 text-sm">{error}</div>}
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Investigation run</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Model → tool → observation → updated state</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">The trace below is the product. It shows which evidence the agent requested, why the tool exists, and what the policy layer does with the final recommendation.</p>
            </div>
            {result && <div className="text-right text-xs"><p className="font-mono font-semibold">{result.model}</p><p className="mt-1 text-[var(--muted)]">{result.mode === "live" ? "live model reasoning" : "deterministic fallback"}</p></div>}
          </div>

          {!result && status !== "investigating" && (
            <div className="mt-8 grid min-h-80 place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center">
              <div className="max-w-md">
                <p className="text-lg font-semibold">No investigation has run yet.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Start an incident to watch Sentinel choose evidence sources, build a diagnosis, and route remediation through policy.</p>
              </div>
            </div>
          )}

          {status === "investigating" && !result && (
            <div className="mt-8 grid min-h-80 place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center">
              <div><div className="mx-auto size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--signal)]" /><p className="mt-4 font-semibold">Collecting evidence and updating hypotheses…</p><p className="mt-2 text-sm text-[var(--muted)]">Live runs may take several model/tool turns.</p></div>
            </div>
          )}

          {result && (
            <div className="mt-7 space-y-3">
              {result.trace.map((step) => (
                <div key={`${step.index}-${step.tool}`} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 md:grid-cols-[44px_1fr_auto] md:items-start">
                  <div className="grid size-9 place-items-center rounded-full bg-[var(--soft)] font-mono text-[11px]">{String(step.index).padStart(2, "0")}</div>
                  <div><div className="flex flex-wrap items-center gap-2"><code className="text-sm font-semibold">{step.tool}()</code><span className="rounded-full bg-[var(--soft)] px-2 py-0.5 text-[10px] text-[var(--muted)]">READ ONLY</span></div><p className="mt-2 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Why:</strong> {step.purpose}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Observed:</strong> {step.summary}</p></div>
                  <div className="font-mono text-[10px] text-[var(--muted)]">{step.latencyMs}ms</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {result && (
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Evidence-backed diagnosis</p><span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold">{Math.round(result.diagnosis.confidence * 100)}% confidence</span></div>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{result.diagnosis.rootCause}</h3>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{result.diagnosis.summary}</p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Evidence used</p>
              <div className="mt-3 space-y-2">{result.evidence.filter((item) => result.diagnosis.evidenceIds.includes(item.id)).map((item) => <div key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><code className="text-[11px]">{item.id}</code><span className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">{item.source} · {item.trust.replaceAll("_", " ")}</span></div><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.detail}</p></div>)}</div>
            </div>

            {result.diagnosis.alternatives.length > 0 && <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Alternative hypotheses considered</p><div className="mt-3 grid gap-2">{result.diagnosis.alternatives.map((item) => <div key={item.hypothesis} className="grid gap-2 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold">{item.hypothesis}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.reason}</p></div><span className="font-mono text-xs">{Math.round(item.confidence * 100)}%</span></div>)}</div></div>}
          </section>

          <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Policy + remediation boundary</p>
            <div className="mt-5 rounded-2xl bg-[var(--ink)] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.12em] text-white/60">Recommended action</p>
              <h3 className="mt-2 text-2xl font-semibold">{label(result.diagnosis.remediation.action)}</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">{result.diagnosis.remediation.reason}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-white/15 p-3"><p className="text-white/60">Risk level</p><p className="mt-1 font-mono font-semibold">{result.policy.risk}</p></div><div className="rounded-xl border border-white/15 p-3"><p className="text-white/60">Approval</p><p className="mt-1 font-mono font-semibold">{result.policy.requiresApproval ? "REQUIRED" : "NOT REQUIRED"}</p></div><div className="rounded-xl border border-white/15 p-3"><p className="text-white/60">Permission</p><p className="mt-1 font-mono font-semibold">{result.policy.permission}</p></div><div className="rounded-xl border border-white/15 p-3"><p className="text-white/60">Reversible</p><p className="mt-1 font-mono font-semibold">{result.diagnosis.remediation.reversible ? "YES" : "NO"}</p></div></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{result.policy.reason}</p>

            {result.diagnosis.escalation.required ? (
              <div className="mt-6 rounded-2xl border border-[var(--orange)]/30 bg-[var(--soft)] p-4"><p className="font-semibold">Human escalation required</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{result.diagnosis.escalation.reason}</p></div>
            ) : !recovery && !rejected ? (
              <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={remediate} disabled={status !== "idle"} className="btn-primary rounded-full px-5">{status === "remediating" ? "Applying…" : result.policy.requiresApproval ? `Approve & simulate ${label(result.diagnosis.remediation.action)}` : `Execute simulated ${label(result.diagnosis.remediation.action)}`}</button><button type="button" onClick={() => setRejected(true)} className="btn-secondary">Reject plan</button></div>
            ) : rejected ? (
              <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm">Plan rejected. Sentinel preserves the investigation evidence and does not modify the simulated environment.</div>
            ) : null}
          </section>
        </div>
      )}

      {result && (
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Run observability</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Every decision leaves an inspectable trail.</h3></div><span className="font-mono text-xs text-[var(--muted)]">{result.runId}</span></div>
          <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">{[
            ["Latency", `${result.metrics.latencyMs}ms`],
            ["Model calls", String(result.metrics.modelCalls)],
            ["Tool calls", String(result.metrics.toolCalls)],
            ["Input tokens", result.metrics.inputTokens.toLocaleString()],
            ["Output tokens", result.metrics.outputTokens.toLocaleString()],
            ["Est. cost", formatCost(result.metrics.estimatedCostUsd)],
            ["Injection signals", String(result.metrics.promptInjectionSignals)],
            ["State", result.state],
          ].map(([name, value]) => <div key={name} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3"><p className="font-mono text-sm font-semibold">{value}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{name}</p></div>)}</div>
        </section>
      )}

      {recovery && (
        <section className="rounded-3xl border border-[var(--green)]/30 bg-[var(--surface)] p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--green)]">Recovery verified</p><h3 className="mt-2 text-2xl font-semibold">Simulated service returned toward baseline.</h3></div><span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold">SIMULATED ACTION · REAL POLICY PATH</span></div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{recovery.verification}</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">{Object.entries(recovery.after).map(([name, value]) => <div key={name} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4"><p className="font-mono text-lg font-semibold">{String(value)}</p><p className="mt-1 text-xs text-[var(--muted)]">{label(name)}</p></div>)}</div>
          <div className="mt-7 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Generated incident artifact</p><h4 className="mt-3 text-lg font-semibold">Postmortem · {recovery.postmortem.incident}</h4><div className="mt-4 grid gap-3 text-sm md:grid-cols-2"><p><strong>Root cause:</strong> {recovery.postmortem.rootCause}</p><p><strong>Remediation:</strong> {recovery.postmortem.remediation}</p></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Preventive actions</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">{recovery.postmortem.preventiveActions.map((item) => <li key={item}>{item}</li>)}</ol></div>
        </section>
      )}

      <section className="grid gap-3 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 md:grid-cols-4 md:p-7">
        <div><p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Safety eval suite</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Deterministic governance checks run separately from live-model quality claims.</p></div>
        <div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-2xl font-semibold">{evalSummary.policyPasses}/{evalSummary.totalCases}</p><p className="mt-1 text-xs text-[var(--muted)]">policy cases passed</p></div>
        <div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-2xl font-semibold">{evalSummary.approvalBypasses}</p><p className="mt-1 text-xs text-[var(--muted)]">approval bypasses</p></div>
        <div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-2xl font-semibold">{evalSummary.injectionDetected}/{evalSummary.injectionCases}</p><p className="mt-1 text-xs text-[var(--muted)]">adversarial log signals detected</p></div>
      </section>
    </div>
  );
}
