"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deskTasks, sourceCatalog, metricLabels, evaluateTimeBudget, type DeskTask } from "@/lib/atlas/desk-catalog";
import type { DeskResult } from "@/lib/atlas/desk-types";

const questions: Record<DeskTask, string> = {
  earnings: "What changed in Aster Data Systems' H1 results? Reconcile the revenue versions, distinguish reported from organic growth, and identify questions an analyst must verify.",
  credit: "Assess Aster Data Systems' leverage proxy and a 20% EBITDA downside. Explain the methodology, conflicting revenue versions, and what is still needed for a real covenant decision.",
  reconciliation: "Reconcile Aster Data Systems' conflicting revenue figures and verify reported growth and operating cash conversion. Produce a source-backed handoff for the data-quality reviewer.",
};
type SourceView = { id: string; title: string; body: string; approved: boolean };
export function AtlasResearchDesk() {
  const [task, setTask] = useState<DeskTask>("earnings"), [question, setQuestion] = useState(questions.earnings);
  const [result, setResult] = useState<DeskResult | null>(null), [previous, setPrevious] = useState<DeskResult | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState(""), [feedback, setFeedback] = useState("");
  const [rules, setRules] = useState<string[]>([]), [storageReady, setStorageReady] = useState(false), [reviewed, setReviewed] = useState(false);
  const [source, setSource] = useState<SourceView | null>(null), [sourceError, setSourceError] = useState(""), [sourceLoading, setSourceLoading] = useState("");
  const [baseline, setBaseline] = useState(45), [assisted, setAssisted] = useState(15), [reviewTime, setReviewTime] = useState(8), [volume, setVolume] = useState(20);
  const controller = useRef<AbortController | null>(null), sourceController = useRef<AbortController | null>(null);
  const sourceReader = useRef<HTMLElement | null>(null);
  const [storageWarning, setStorageWarning] = useState("");
  useEffect(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem("atlas-review-rules-v1") || "[]"); if (Array.isArray(saved)) setRules(saved.filter((r): r is string => typeof r === "string" && r.length <= 1000).slice(0, 6)); } catch { setStorageWarning("Browser rule storage is unavailable. You can still run the agent."); }
    setStorageReady(true);
    return () => { controller.current?.abort(); sourceController.current?.abort(); };
  }, []);
  useEffect(() => { if (storageReady) { try { localStorage.setItem("atlas-review-rules-v1", JSON.stringify(rules)); } catch { setStorageWarning("Rules apply to this session only; browser storage is unavailable."); } } }, [rules, storageReady]);
  useEffect(() => { if (source) sourceReader.current?.focus(); }, [source]);
  function invalidate() { setResult(null); setPrevious(null); setReviewed(false); setFeedback(""); setError(""); }
  async function inspectSource(id: string) {
    sourceController.current?.abort(); const active = new AbortController(); sourceController.current = active;
    setSourceLoading(id); setSource(null); setSourceError("");
    try { const response = await fetch(`/api/atlas/evidence?id=${encodeURIComponent(id)}`, { signal: active.signal }); if (!response.ok) throw new Error("This source is not available to the demo analyst."); const body = await response.json(); if (!active.signal.aborted) setSource(body); }
    catch (err) { if (!active.signal.aborted) setSourceError(err instanceof Error ? err.message : "Source unavailable."); }
    finally { if (!active.signal.aborted) setSourceLoading(""); }
  }
  async function run(revise = false) {
    if (controller.current) return;
    if (question.trim().length < 10 || question.length > 2000) { setError("Enter a question in 10–2,000 characters."); return; }
    if (revise && !feedback.trim()) { setError("Tell the agent what the reviewer wants changed."); return; }
    const active = new AbortController(); controller.current = active; const deadline = window.setTimeout(() => active.abort(), 65000);
    setLoading(true); setError(""); setReviewed(false);
    try {
      const response = await fetch("/api/atlas/research", { method: "POST", headers: { "Content-Type": "application/json" }, signal: active.signal, body: JSON.stringify({ task, question, reviewerFeedback: revise ? feedback : "", approvedRules: rules }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Investigation did not complete.");
      if (revise) setPrevious(result); else setPrevious(null);
      setResult(body); setFeedback("");
    } catch (err) { setError(active.signal.aborted ? "The run timed out. Retry with a simpler question." : err instanceof Error ? err.message : "Investigation did not complete."); }
    finally { window.clearTimeout(deadline); controller.current = null; setLoading(false); }
  }
  function acceptRule() {
    if (!result || rules.includes(result.brief.proposedRule) || rules.length >= 6) return;
    setRules([...rules, result.brief.proposedRule]);
  }
  function downloadBrief() {
    if (!result) return;
    const b = result.brief;
    const content = ["ATLAS FINANCIAL RESEARCH DESK", "Synthetic Aster Data Systems evidence. Not investment advice. Human review required.", b.title, b.summary, "", ...b.findings.flatMap(f => [metricLabels[f.metricId], f.conclusion, "Caveat: " + f.caveat, "Sources: " + f.sourceIds.join(", ")]), "", "REPRODUCIBLE CALCULATIONS", ...result.calculations.map(c => `${c.id}: ${c.value.toFixed(4)} ${c.unit}\n${c.formula}\n${c.caveat}`), "", "OPEN QUESTIONS", ...b.openQuestions, "", "PILOT SCOPE", b.pilot.scope, "Owner: " + b.pilot.owner, ...b.pilot.launchGates, ...b.pilot.successMetrics, "Next experiment: " + b.pilot.nextExperiment, "", "REVISION", b.revisionSummary, "Review status: " + (reviewed ? "Marked reviewed in this browser only" : "Pending"), "Run: " + result.runId].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `atlas-${task}-brief.txt`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const validBenchmark = [baseline, assisted, reviewTime].every(v => Number.isFinite(v) && v >= 0 && v <= 600) && Number.isFinite(volume) && volume >= 0 && volume <= 10000;
  const weeklyHours = validBenchmark ? evaluateTimeBudget(baseline, assisted, reviewTime, volume).hoursPerWeek : 0;
  return <main className="research-desk">
    <div className="desk-topline"><Link href="/projects">← Projects</Link><span>Atlas / Financial Research Desk</span><Link href="/projects/atlas/strategy">Pilot strategy ↗</Link></div>
    <header className="desk-heading"><div><p className="desk-kicker">Evidence → analysis → human review</p><h1>Turn conflicting financial data into a brief you can defend.</h1><p>A live agent reads sources, runs reproducible calculations, and prepares an analyst handoff. Choose a task to begin.</p></div><div className="desk-boundary"><strong>Synthetic company. Real agent.</strong><p>Aster Data Systems is fictional. No Bloomberg, S&P Global, Rogo, or Kensho data, access, affiliation, or endorsement. No trades, ratings, or external writes.</p></div></header>
    <div className="desk-layout">
      <aside className="desk-evidence-pane"><div className="desk-pane-title"><h2>Evidence pack</h2><span>6 sources</span></div><p className="desk-muted">Demo analyst access. Open a source to inspect the original text.</p>
        <div className="desk-source-list">{sourceCatalog.map(doc => <button type="button" key={doc.id} onClick={() => void inspectSource(doc.id)} aria-pressed={source?.id === doc.id} className={doc.id === "F04" ? "desk-source desk-source-draft" : "desk-source"} data-testid={`source-${doc.id}`}><span>{doc.id} · {doc.kind}</span><strong>{doc.title}</strong><small>{doc.status} · {doc.date}</small></button>)}</div>
        <p className="desk-permission">Restricted evidence is excluded before content is returned. This is a demo boundary, not production SSO.</p>
        {sourceLoading && <p role="status">Opening {sourceLoading}…</p>}{sourceError && <p role="alert">{sourceError}</p>}
        {source && <section className="desk-source-reader" ref={sourceReader} tabIndex={-1} data-testid="source-reader"><div className="desk-pane-title"><h3>{source.id} · Source text</h3><button onClick={() => setSource(null)} aria-label="Close source">×</button></div><p>{source.body}</p></section>}
      </aside>
      <div className="desk-workspace"><section className="desk-panel"><div className="desk-pane-title"><h2>What should the analyst investigate?</h2><span>One-click demo</span></div>
        <div className="desk-task-grid">{Object.entries(deskTasks).map(([id, spec]) => <button type="button" className="desk-task" key={id} aria-pressed={task === id} disabled={loading} data-testid={`task-${id}`} onClick={() => { setTask(id as DeskTask); setQuestion(questions[id as DeskTask]); invalidate(); }}><small>{spec.audience}</small><strong>{spec.name}</strong><span>{spec.description}</span></button>)}</div>
        <label className="desk-question">Your question<textarea value={question} maxLength={2000} disabled={loading} onChange={e => { setQuestion(e.target.value); invalidate(); }} data-testid="desk-question" /></label>
        <div className="desk-run-row"><button className="desk-primary" onClick={() => void run()} disabled={loading || !storageReady} data-testid="desk-run">{loading ? "Agent investigating…" : "Investigate & build brief →"}</button><span>Read-only tools · Human-reviewed output</span></div>
        {loading && <p role="status">The model is choosing sources and calculations. No scripted brief will be substituted. This can take up to a minute.</p>}
        {error && <p className="desk-error" role="alert" data-testid="desk-error">{error}</p>}
        <p className="desk-muted">Do not enter confidential data or credentials. Questions, feedback, and accepted rules are sent to the model provider. Briefs stay in page memory; only accepted process rules are saved in this browser.</p>
      </section>
      {result && <div data-testid="desk-result">
        <section className="desk-panel desk-brief"><div className="desk-pane-title"><div><p className="desk-kicker">{previous ? "Revised analyst handoff" : "Analyst handoff"}</p><h2>{result.brief.title}</h2></div><button className="desk-secondary" onClick={downloadBrief} data-testid="desk-export">Export brief ↓</button></div><p className="desk-summary">{result.brief.summary}</p>
          <div className="desk-metric-grid">{result.calculations.filter(c => c.id !== "document_conflict").map(c => <article key={c.id}><span>{metricLabels[c.id]}</span><strong>{c.value.toFixed(2)}<small> {c.unit}</small></strong><p>{c.formula}</p><small>{c.caveat}</small></article>)}</div>
          <div className="desk-conflict"><strong>Version conflict found · USD 30m discrepancy</strong><p>F04’s draft 510 is superseded by F02’s approved 480. This is a source-version discrepancy—not a comparable-period revenue decline.</p><button onClick={() => void inspectSource("F04")}>Inspect superseded source</button></div>
          <div className="desk-findings">{result.brief.findings.map(f => <article key={f.metricId}><h3>{metricLabels[f.metricId]}</h3><p>{f.conclusion}</p><p className="desk-muted">{f.caveat}</p><div className="desk-citations">{f.sourceIds.map(id => <button key={id} onClick={() => void inspectSource(id)} aria-label={`Inspect citation ${id}`}>{id} ↗</button>)}</div></article>)}</div>
          <details className="desk-details" open><summary>Questions before a real decision</summary><ul>{result.brief.openQuestions.map(q => <li key={q}>{q}</li>)}</ul></details>
          <div className="desk-review-status"><p><strong>{reviewed ? "Marked reviewed in this browser" : "Human review required"}</strong><br />Structural checks do not prove financial accuracy. Nothing is released or sent externally.</p><button className="desk-secondary" onClick={() => setReviewed(true)} disabled={reviewed || loading} data-testid="desk-review">{reviewed ? "Reviewed ✓" : "Mark as reviewed"}</button></div>
        </section>
        <section className="desk-panel"><h2>Make the next run better</h2><p className="desk-muted">A reviewer can challenge emphasis or methodology. Feedback cannot replace source facts or grant permissions.</p><label className="desk-question">Reviewer correction<textarea value={feedback} maxLength={2000} disabled={loading} placeholder="Example: Emphasize that annualized H1 leverage is a proxy, not actual covenant compliance." onChange={e => setFeedback(e.target.value)} data-testid="desk-feedback" /></label><button className="desk-primary" disabled={loading || !feedback.trim()} onClick={() => void run(true)} data-testid="desk-revise">Reinvestigate with feedback →</button>
          {previous && <div className="desk-revision" data-testid="desk-revision"><strong>Revision record</strong><p>{result.brief.revisionSummary}</p><small>Previous run {previous.runId.slice(0, 8)} → current {result.runId.slice(0, 8)}. Both remain in page memory until inputs change or the page closes.</small></div>}
          <div className="desk-rule"><p className="desk-kicker">Proposed process rule · not yet accepted</p><p>{result.brief.proposedRule}</p><button className="desk-secondary" disabled={loading || rules.includes(result.brief.proposedRule) || rules.length >= 6} onClick={acceptRule} data-testid="desk-accept-rule">{rules.includes(result.brief.proposedRule) ? "Accepted for next run ✓" : "Accept rule in this browser"}</button></div>
        </section>
        <section className="desk-panel"><h2>From working brief to first pilot</h2><p>{result.brief.pilot.scope}</p><p className="desk-muted">Owner: {result.brief.pilot.owner}</p><div className="desk-two-columns"><div><h3>Launch gates</h3><ul>{result.brief.pilot.launchGates.map(g => <li key={g}>{g}</li>)}</ul></div><div><h3>Measure the outcome</h3><ul>{result.brief.pilot.successMetrics.map(m => <li key={m}>{m}</li>)}</ul></div></div><p><strong>Next experiment:</strong> {result.brief.pilot.nextExperiment}</p><Link href="/projects/atlas/strategy" className="desk-inline-link">Explore the 90-day deployment planner →</Link></section>
        <section className="desk-panel"><h2>Run checks & agent trace</h2><p className="desk-muted">Measured structural gates—not a model-generated quality score. Meaning and financial judgment still need a reviewer.</p><div className="desk-checks">{result.checks.map(c => <article key={c.name}><strong>{c.passed ? "✓" : "×"} {c.name}</strong><p>{c.detail}</p></article>)}</div><details className="desk-details"><summary>Inspect {result.trace.length} actual tool calls</summary><ol data-testid="desk-trace">{result.trace.map(t => <li key={t.evidenceId}><strong>{t.tool.replaceAll("_", " ")}</strong> · {t.detail}<small>{t.evidenceId} · {t.status}</small></li>)}</ol></details><p className="desk-telemetry">Live · {result.model} · {result.telemetry.modelCalls} model calls · {(result.telemetry.latencyMs / 1000).toFixed(1)}s · {result.telemetry.inputTokens + result.telemetry.outputTokens} tokens · {result.telemetry.providerRetries} provider retries</p><p className="desk-muted">Run {result.runId}</p></section>
      </div>}
      <section className="desk-panel"><h2>Your review playbook</h2><p className="desk-muted">Accepted process rules are local to this browser and supplied to subsequent runs. This is human-governed procedural memory—not model retraining or shared enterprise storage.</p>{storageWarning && <p role="status">{storageWarning}</p>}{rules.length ? <ul className="desk-rule-list" data-testid="desk-rules">{rules.map((rule, i) => <li key={rule}><span>{rule}</span><button disabled={loading} onClick={() => setRules(rules.filter((_, index) => index !== i))} aria-label={`Remove rule ${i + 1}`}>Remove</button></li>)}</ul> : <p className="desk-muted">No accepted rules yet. Build a brief and accept a proposed rule after review.</p>}</section>
      <details className="desk-panel desk-details"><summary>Pilot time-budget calculator</summary><p className="desk-muted">Replace the illustrative defaults with your own observations. These inputs are not measured customer outcomes and are not sent to the model.</p><div className="desk-benchmark">{[["Manual minutes / task", baseline, setBaseline], ["Assisted minutes / task", assisted, setAssisted], ["Review minutes / task", reviewTime, setReviewTime], ["Tasks / week", volume, setVolume]].map(([label, value, setter]) => <label key={label as string}>{label as string}<input type="number" min="0" max={label === "Tasks / week" ? 10000 : 600} value={Number.isFinite(value) ? value as number : ""} onChange={e => (setter as (n: number) => void)(e.target.value === "" ? NaN : Number(e.target.value))} /></label>)}</div><p aria-live="polite">{validBenchmark ? <><strong>{Math.abs(weeklyHours).toFixed(1)} hours / week {weeklyHours < 0 ? "added effort" : "potentially returned"}</strong> · Based only on your inputs, including human-review time.</> : "Use nonnegative inputs within the stated limits."}</p></details>
      </div>
    </div>
  </main>;
}
