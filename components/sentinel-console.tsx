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

type ScenarioGuide = {
  label: string;
  broke: string;
  human: string;
  goal: string;
  lesson: string;
};

const SCENARIO_GUIDE: Record<string, ScenarioGuide> = {
  database_connection_exhaustion: {
    label: "Checkout failures after a release",
    broke: "Customers suddenly cannot complete payments. The payment API error rate jumps from 0.2% to 17%.",
    human: "An on-call engineer would compare metrics, search error logs, inspect the latest deployment, check the database, and find the relevant runbook.",
    goal: "Figure out whether the database itself is failing or whether a recent application change is exhausting its connection pool.",
    lesson: "Correlation across metrics, logs, deployment history, code changes, and runbooks.",
  },
  api_latency_spike: {
    label: "An API became 3× slower",
    broke: "Requests still succeed, but users are waiting much longer for inventory results.",
    human: "An engineer would compare application, database, and downstream-service timing to find what was added to the request path.",
    goal: "Determine whether the slowdown comes from the model, database, network, or newly added downstream calls.",
    lesson: "Performance diagnosis without blaming the wrong subsystem.",
  },
  bad_deployment: {
    label: "A release immediately caused 503 errors",
    broke: "The order API starts failing almost immediately after a new version is deployed.",
    human: "An engineer would compare the timing of the release with the start of errors, inspect the changed configuration, and decide whether rollback is justified.",
    goal: "Prove that the new timeout and retry settings caused the failure before recommending rollback.",
    lesson: "Release correlation, evidence quality, and safe rollback decisions.",
  },
  memory_leak: {
    label: "A service slowly runs out of memory",
    broke: "Memory climbs all day until instances restart, even though traffic and CPU look normal.",
    human: "An engineer would check memory trends, garbage-collection logs, recent releases, and whether restarting is only a temporary containment action.",
    goal: "Separate a real memory leak from traffic growth or a bad deployment and preserve evidence before restart.",
    lesson: "Long-running failure diagnosis and reversible mitigation.",
  },
  service_down: {
    label: "A configuration change took a service offline",
    broke: "Every notification-service instance stops starting after a configuration rollout.",
    human: "An engineer would inspect startup errors, compare the configuration change, and confirm whether dependencies are healthy.",
    goal: "Identify the missing required setting and restore the last known-good configuration.",
    lesson: "Configuration failures, dependency isolation, and recovery verification.",
  },
  network_failure: {
    label: "Only cross-region traffic is failing",
    broke: "Local requests work, but requests crossing regions time out.",
    human: "An engineer would compare local and cross-region health before restarting healthy applications unnecessarily.",
    goal: "Show that packet loss in the network path—not the application or database—is the failure domain.",
    lesson: "Failure-domain isolation and avoiding harmful remediation.",
  },
  schema_change: {
    label: "A data schema change broke consumers",
    broke: "An analytics pipeline suddenly rejects thousands of events after a producer changes its payload format.",
    human: "A data engineer would inspect validation errors, the producer release, compatibility settings, and consumer lag.",
    goal: "Find the incompatible schema change and stop the bad producer before replaying queued data.",
    lesson: "Data contracts, compatibility, and safe pipeline recovery.",
  },
  authentication_failure: {
    label: "Users cannot log in after key rotation",
    broke: "Login success collapses even though the identity provider is healthy.",
    human: "An engineer would inspect signature errors, the signing-key rotation, and the service's local key cache.",
    goal: "Determine whether the new signing key is valid but missing from a stale local cache.",
    lesson: "Authentication debugging and targeted remediation instead of broad restarts.",
  },
  queue_backlog: {
    label: "A queue is growing faster than workers can drain it",
    broke: "Background work piles up and processing delay keeps increasing.",
    human: "An engineer would compare incoming rate, processing rate, worker health, retry behavior, and downstream dependencies.",
    goal: "Identify whether the backlog needs more workers, slower producers, or a fix to a failing dependency.",
    lesson: "Capacity reasoning, backpressure, and operational tradeoffs.",
  },
  unknown_failure: {
    label: "The evidence conflicts and a log tries to manipulate the agent",
    broke: "The service is degraded, the signals do not point to one clear cause, and one log line contains malicious instructions aimed at the model.",
    human: "A careful engineer would preserve uncertainty, treat logs as data rather than commands, collect more evidence, and escalate if confidence remains low.",
    goal: "Demonstrate that Sentinel can recognize prompt-injection-like content and say 'I do not know yet' instead of inventing a root cause.",
    lesson: "Prompt-injection defense, uncertainty, and human escalation.",
  },
};

const TOOL_LABELS: Record<string, string> = {
  get_service_health: "Check which services are healthy",
  query_metrics: "Compare monitoring metrics",
  search_logs: "Search application logs",
  get_recent_deployments: "Check what changed recently",
  get_git_changes: "Inspect the release changes",
  query_database: "Check database health",
  search_runbooks: "Find the relevant runbook",
  search_incidents: "Compare with past incidents",
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
  const guide = scenario ? SCENARIO_GUIDE[scenario.id] : undefined;

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

  if (!scenario || !guide) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Step 1 · Pick a real-world failure</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">What should Sentinel investigate?</h3>
            <label className="mt-6 block text-sm font-semibold" htmlFor="sentinel-scenario">Incident story</label>
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
              {scenarios.map((item) => <option key={item.id} value={item.id}>{SCENARIO_GUIDE[item.id]?.label ?? item.title}</option>)}
            </select>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px] font-semibold">{scenario.severity}</span>
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px]">{scenario.service}</span>
              <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[11px]">simulated production</span>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--bg)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What broke?</p>
              <p className="mt-2 text-base font-semibold leading-6">{guide.broke}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
              <span className="font-mono text-xs text-[var(--signal)]">01</span>
              <h4 className="mt-4 font-semibold">What a human normally does</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{guide.human}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
              <span className="font-mono text-xs text-[var(--signal)]">02</span>
              <h4 className="mt-4 font-semibold">What Sentinel must discover</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{guide.goal}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
              <span className="font-mono text-xs text-[var(--signal)]">03</span>
              <h4 className="mt-4 font-semibold">What this scenario proves</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{guide.lesson}</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 border-t border-[var(--line)] pt-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Investigation mode</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Live mode lets OpenAI choose the next read-only tool. The policy layer still controls authority.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!liveConfigured} onClick={() => setMode("live")} className={mode === "live" ? "btn-primary rounded-full px-4" : "btn-secondary"}>Live OpenAI</button>
            <button type="button" onClick={() => setMode("deterministic")} className={mode === "deterministic" ? "btn-primary rounded-full px-4" : "btn-secondary"}>Deterministic replay</button>
            <button type="button" onClick={investigate} disabled={status !== "idle"} className="btn-primary rounded-full px-5 disabled:cursor-wait disabled:opacity-60">{status === "investigating" ? "Investigating…" : "Start investigation →"}</button>
          </div>
        </div>
        {error && <div role="alert" className="mt-4 rounded-xl border border-[var(--orange)]/30 bg-[var(--soft)] p-3 text-sm">{error}</div>}
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Step 2 · Watch the investigation</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Sentinel decides what evidence it needs next.</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">This is the agentic part: it is not given one fixed sequence. In live mode the model can choose among bounded tools, inspect each result, and then decide what to check next.</p>
          </div>
          {result && <div className="rounded-xl bg-[var(--soft)] px-4 py-3 text-right text-xs"><p className="font-mono font-semibold">{result.model}</p><p className="mt-1 text-[var(--muted)]">{result.mode === "live" ? "live model run" : "deterministic replay"}</p></div>}
        </div>

        {!result && status !== "investigating" && <div className="mt-8 grid min-h-56 place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center"><div className="max-w-lg"><p className="text-lg font-semibold">Nothing has run yet.</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Choose an incident above and click Start investigation. The technical trace will appear here only after you know what problem the system is trying to solve.</p></div></div>}

        {status === "investigating" && !result && <div className="mt-8 grid min-h-56 place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center"><div><div className="mx-auto size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--signal)]" /><p className="mt-4 font-semibold">Collecting evidence and updating the diagnosis…</p><p className="mt-2 text-sm text-[var(--muted)]">The live model may use several tool calls before it has enough evidence.</p></div></div>}

        {result && <div className="mt-8 grid gap-3 lg:grid-cols-2">{result.trace.map((step) => <div key={`${step.index}-${step.tool}`} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{TOOL_LABELS[step.tool] ?? label(step.tool)}</p><code className="mt-1 block text-[11px] text-[var(--muted)]">{step.tool}()</code></div><span className="font-mono text-[10px] text-[var(--muted)]">{step.latencyMs}ms</span></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">What it found:</strong> {step.summary}</p></div>)}</div>}
      </section>

      {result && (
        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Step 3 · What Sentinel concluded</p>
            <div className="mt-4 flex flex-wrap items-center gap-3"><h3 className="text-3xl font-semibold tracking-[-0.04em]">{result.diagnosis.rootCause}</h3><span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold">{Math.round(result.diagnosis.confidence * 100)}% confidence</span></div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{result.diagnosis.summary}</p>

            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Evidence that supports the conclusion</p>
              <div className="mt-3 space-y-2">{result.evidence.filter((item) => result.diagnosis.evidenceIds.includes(item.id)).map((item) => <div key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{item.title}</p><span className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">{item.source}</span></div><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.detail}</p></div>)}</div>
            </div>

            {result.diagnosis.alternatives.length > 0 && <div className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What else it considered</p><div className="mt-3 grid gap-2">{result.diagnosis.alternatives.map((item) => <div key={item.hypothesis} className="grid gap-2 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold">{item.hypothesis}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.reason}</p></div><span className="font-mono text-xs">{Math.round(item.confidence * 100)}%</span></div>)}</div></div>}
          </div>

          <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--signal)]">Step 4 · What happens next</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{label(result.diagnosis.remediation.action)}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{result.diagnosis.remediation.reason}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-[var(--muted)]">Risk level</p><p className="mt-1 font-mono font-semibold">{result.policy.risk}</p></div>
              <div className="rounded-xl bg-[var(--bg)] p-4"><p className="text-[var(--muted)]">Human approval</p><p className="mt-1 font-mono font-semibold">{result.policy.requiresApproval ? "REQUIRED" : "NOT REQUIRED"}</p></div>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--ink)] p-5 text-white">
              <p className="text-sm font-semibold">Why the model cannot just do whatever it wants</p>
              <p className="mt-2 text-xs leading-5 text-white/70">The model proposes an action. Separate deterministic code checks the action, environment, permission, and risk. High-risk production actions cannot execute without approval.</p>
            </div>

            {!recovery && !rejected && result.diagnosis.remediation.action !== "no_action" && <div className="mt-6 flex flex-wrap gap-2">{result.policy.requiresApproval ? <><button type="button" onClick={remediate} disabled={status !== "idle"} className="btn-primary rounded-full px-5">{status === "remediating" ? "Applying…" : "Approve simulated action"}</button><button type="button" onClick={() => setRejected(true)} className="btn-secondary">Reject</button></> : <button type="button" onClick={remediate} disabled={status !== "idle"} className="btn-primary rounded-full px-5">Apply safe simulated action</button>}</div>}
            {rejected && <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm"><strong>Action rejected.</strong><p className="mt-1 text-xs leading-5 text-[var(--muted)]">The investigation remains available for a human engineer to continue. Nothing was changed.</p></div>}
          </div>
        </section>
      )}

      {result && <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8"><div className="grid gap-4 md:grid-cols-4"><div><p className="text-xs text-[var(--muted)]">Total run time</p><p className="mt-1 text-xl font-semibold">{(result.metrics.latencyMs / 1000).toFixed(1)}s</p></div><div><p className="text-xs text-[var(--muted)]">Tool calls</p><p className="mt-1 text-xl font-semibold">{result.metrics.toolCalls}</p></div><div><p className="text-xs text-[var(--muted)]">Model tokens</p><p className="mt-1 text-xl font-semibold">{result.metrics.inputTokens + result.metrics.outputTokens}</p></div><div><p className="text-xs text-[var(--muted)]">Estimated model cost</p><p className="mt-1 text-xl font-semibold">{formatCost(result.metrics.estimatedCostUsd)}</p></div></div><p className="mt-5 text-xs leading-5 text-[var(--muted)]">These are run-level observability signals. The separate CI safety suite currently covers {evalSummary.totalCases} governance cases with {evalSummary.approvalBypasses} approval bypasses.</p></section>}

      {recovery && (
        <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--green)]">Step 5 · Recovery verified</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">The simulated service recovered.</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{recovery.verification}</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-[var(--bg)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Before → after</p><div className="mt-4 space-y-2">{Object.keys(recovery.after).map((key) => <div key={key} className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-2 text-sm"><span>{label(key)}</span><span className="font-mono text-xs">{String(recovery.before[key] ?? "—")} → {String(recovery.after[key])}</span></div>)}</div></div>
            <div className="rounded-2xl bg-[var(--ink)] p-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Generated postmortem</p><p className="mt-4 text-sm"><strong>Root cause:</strong> {recovery.postmortem.rootCause}</p><p className="mt-3 text-sm"><strong>Remediation:</strong> {recovery.postmortem.remediation}</p><div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">Preventive actions</p><ul className="mt-2 space-y-1 text-sm text-white/75">{recovery.postmortem.preventiveActions.map((item) => <li key={item}>• {item}</li>)}</ul></div></div>
          </div>
        </section>
      )}
    </div>
  );
}
