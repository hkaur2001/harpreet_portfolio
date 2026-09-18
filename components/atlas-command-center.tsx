"use client";

import { useEffect, useRef, useState } from "react";
import { verticals, type VerticalId } from "@/lib/atlas/scenarios";
import type { AtlasAgentResult } from "@/lib/atlas/types";

const exampleBrief = "Our banking analysts rebuild diligence evidence from deal rooms, SharePoint, and research files. They spend hours reconciling conflicting claims before a VP reviews the memo. We want a first AI pilot that saves analyst time without automating investment judgment or sending unapproved material externally.";
type View = "start" | "plan" | "evidence";

export function AtlasCommandCenter() {
  const [verticalId, setVerticalId] = useState<VerticalId>("banking");
  const [brief, setBrief] = useState(exampleBrief);
  const [riskTolerance, setRiskTolerance] = useState(42);
  const [capacity, setCapacity] = useState(6);
  const [strictGovernance, setStrictGovernance] = useState(true);
  const [view, setView] = useState<View>("start");
  const [result, setResult] = useState<AtlasAgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const vertical = verticals[verticalId];
  useEffect(() => () => controllerRef.current?.abort(), []);
  function invalidate() { setResult(null); setReviewed(false); setError(""); }

  async function runAgent() {
    if (controllerRef.current) return;
    if (brief.trim().length < 40 || brief.length > 4000) { setError("Describe the workflow in 40–4,000 characters."); return; }
    const controller = new AbortController();
    controllerRef.current = controller;
    const deadline = window.setTimeout(() => controller.abort(), 65_000);
    setLoading(true); setError(""); setResult(null); setReviewed(false);
    try {
      const response = await fetch("/api/atlas/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verticalId, brief, riskTolerance, capacity, strictGovernance }), signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The agent could not complete this run.");
      setResult(body as AtlasAgentResult); setView("plan");
    } catch (err) { setError(controller.signal.aborted ? "The run timed out. Please retry with a shorter brief." : err instanceof Error ? err.message : "The agent could not complete this run."); }
    finally { window.clearTimeout(deadline); controllerRef.current = null; setLoading(false); }
  }

  function exportBrief() {
    if (!result) return;
    const p = result.plan;
    const content = ["ATLAS — AI DEPLOYMENT BRIEF", p.goal, "FIRST PILOT: " + vertical.workflows[p.recommendedWorkflowIndex].name, p.rationale, ...p.phases.flatMap(phase => ["", phase.dayRange + " — " + phase.objective, "Owner: " + phase.owner, ...phase.actions.map(a => "- " + a)]), "", "LAUNCH GATES", ...p.launchGates, "", "OPEN QUESTIONS", ...p.discoveryQuestions, "", "ASSUMPTIONS AND RISKS", ...p.assumptions, ...p.risks, "", "EVIDENCE", ...result.trace.map(t => t.evidenceId + ": " + t.summary), "", "Run ID: " + result.runId, "Human review required. No external action authorized."].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "atlas-" + verticalId + "-deployment-brief.txt"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="atlas-shell" data-testid="atlas-root">
    <section className="atlas-hero"><div className="atlas-orb atlas-orb-one" aria-hidden="true" /><div className="atlas-wrap atlas-hero-grid">
      <div><div className="atlas-kicker"><span className="atlas-live-dot" /> Atlas · AI deployment command center</div><h1>Find the right first AI pilot. Know how to launch it safely.</h1><p>Describe how your team works. Atlas investigates the evidence, compares candidate workflows, and builds a practical 90-day deployment plan—with risks, owners, and open questions made clear.</p><div className="atlas-hero-actions"><a className="atlas-button atlas-button-primary" href="#atlas-workspace">Start with your workflow →</a><a className="atlas-button atlas-button-ghost" href="#atlas-how">How it works</a></div></div>
      <div className="atlas-brief-card" id="atlas-how"><div className="atlas-card-header"><div><span>The goal, in one sentence</span><strong>Choose a pilot you can defend.</strong></div><span className="atlas-status">Agentic</span></div><div className="atlas-brief-flow"><div><span>01</span><p>Describe</p><strong>Explain the work, bottleneck, systems, and decision boundary.</strong></div><div><span>02</span><p>Investigate</p><strong>The agent chooses tools to inspect candidates, capacity, and controls.</strong></div><div><span>03</span><p>Review</p><strong>Get a first-pilot recommendation, its evidence, and a 90-day plan.</strong></div></div><div className="atlas-brief-footer"><span>Read-only tools. No autonomous writes.</span><strong>Human-led</strong></div></div>
    </div></section>
    <section className="atlas-workspace" id="atlas-workspace"><div className="atlas-wrap">
      <div className="atlas-tabs" aria-label="Atlas workspace"><button type="button" aria-pressed={view === "start"} onClick={() => setView("start")}>01 Describe the work</button><button type="button" aria-pressed={view === "plan"} disabled={!result} onClick={() => setView("plan")}>02 Deployment plan</button><button type="button" aria-pressed={view === "evidence"} disabled={!result} onClick={() => setView("evidence")}>03 Agent evidence</button></div>
      {view === "start" && <div className="atlas-panel"><div className="atlas-panel-title"><div><span>Start here</span><h2>What work should AI help your team do?</h2></div><p>Use an industry scenario as a starting point. Scenario data is synthetic; the agent's investigation and recommendation are live.</p></div><div className="atlas-intake-grid"><div className="atlas-intake">
        <label htmlFor="atlas-industry">Industry</label><select id="atlas-industry" value={verticalId} disabled={loading} data-testid="atlas-vertical" onChange={e => { setVerticalId(e.target.value as VerticalId); invalidate(); }}>{Object.entries(verticals).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select>
        <label htmlFor="atlas-brief">Your workflow</label><p className="atlas-help">Who does the work? Where does it get stuck? What systems are involved? Which decisions must stay with a person?</p><textarea id="atlas-brief" rows={7} value={brief} maxLength={4000} disabled={loading} data-testid="atlas-brief" onChange={e => { setBrief(e.target.value); invalidate(); }} /><div className="atlas-input-footer"><span>{brief.length}/4,000 characters</span><button type="button" disabled={loading} onClick={() => { setBrief(exampleBrief); setVerticalId("banking"); invalidate(); }}>Use banking example</button></div>
        <details className="atlas-advanced"><summary>Deployment constraints <span>Optional</span></summary><div className="atlas-controls"><label><span>Risk tolerance <strong>{riskTolerance}%</strong></span><input type="range" min="0" max="100" value={riskTolerance} disabled={loading} data-testid="risk-slider" onChange={e => { setRiskTolerance(Number(e.target.value)); invalidate(); }} /></label><label><span>Delivery capacity <strong>{capacity} FTE</strong></span><input type="range" min="1" max="16" value={capacity} disabled={loading} data-testid="capacity-slider" onChange={e => { setCapacity(Number(e.target.value)); invalidate(); }} /></label><label className="atlas-toggle"><span><strong>Strict governance</strong><small>Mandatory security controls always stay on</small></span><input type="checkbox" checked={strictGovernance} disabled={loading} data-testid="strict-governance" onChange={e => { setStrictGovernance(e.target.checked); invalidate(); }} /><i aria-hidden="true" /></label></div></details>
        <button type="button" className="atlas-button atlas-button-primary atlas-full" disabled={loading} onClick={runAgent} data-testid="run-agent">{loading ? "Agent investigating your deployment…" : "Find my first AI pilot →"}</button>{loading && <p className="atlas-agent-status" role="status">The agent is gathering evidence and checking deployment boundaries. This can take up to a minute.</p>}{error && <p className="atlas-error" role="alert">{error}</p>}<p className="atlas-help atlas-privacy">Do not paste private customer data, credentials, or confidential employer information. Your brief is sent to the model provider for this run; Atlas does not save it.</p>
      </div><aside className="atlas-inspector"><span className="atlas-overline">What you'll receive</span><h3>A decision, not another dashboard.</h3><ul className="atlas-deliverables">{[["First pilot", "Why this workflow should come before the others."], ["90-day plan", "Three stages with actions and accountable owners."], ["Launch gates", "Evidence required before expanding cohort or authority."], ["Agent trace", "Tools it chose and evidence supporting its recommendation."]].map(([title, description]) => <li key={title}><strong>{title}</strong><span>{description}</span></li>)}</ul><div className="atlas-intake-boundary"><strong>Not a production connector</strong><p>The agent investigates scenario evidence and your brief. It cannot access enterprise systems, grant permissions, or execute writes.</p></div></aside></div></div>}
      {view === "plan" && result && <div className="atlas-panel" data-testid="atlas-plan"><div className="atlas-panel-title"><div><span>Agent recommendation · review required</span><h2 data-testid="recommendation-title">{vertical.workflows[result.plan.recommendedWorkflowIndex].name}</h2></div><button type="button" className="atlas-button atlas-button-ghost" onClick={exportBrief}>Export deployment brief ↓</button></div><div className="atlas-recommendation"><span>Your goal</span><h3>{result.plan.goal}</h3><p>{result.plan.rationale}</p></div><div className="atlas-timeline">{result.plan.phases.map((phase, i) => <article key={i}><span>{phase.dayRange}</span><h3>{phase.objective}</h3><p>Owner: {phase.owner}</p><ul>{phase.actions.map((action, j) => <li key={j}>{action}</li>)}</ul></article>)}</div><div className="atlas-review-grid">{[{ title: "Launch gates", items: result.plan.launchGates }, { title: "Measure the outcome", items: result.plan.metrics }, { title: "Open discovery questions", items: result.plan.discoveryQuestions }, { title: "Risks and assumptions", items: [...result.plan.risks, ...result.plan.assumptions] }].map(group => <article key={group.title}><h3>{group.title}</h3><ul>{group.items.map((item, i) => <li key={i}>{item}</li>)}</ul></article>)}</div><div className="atlas-review-bar"><p><strong>{reviewed ? "Marked as human reviewed." : "Human judgment is the final gate."}</strong><span>Review assumptions and owners before using this plan. This action authorizes no external write.</span></p><button type="button" className="atlas-button atlas-button-approve" disabled={reviewed} data-testid="approve-output" onClick={() => setReviewed(true)}>{reviewed ? "Reviewed ✓" : "Mark as reviewed"}</button><button type="button" className="atlas-button atlas-button-ghost" onClick={() => setView("evidence")}>Inspect agent evidence →</button></div></div>}
      {view === "evidence" && result && <div className="atlas-panel" data-testid="agent-evidence"><div className="atlas-panel-title"><div><span>Observed tool calls, not a scripted animation</span><h2>See how the agent investigated.</h2></div><p>The model selected these read-only tools. The server validated their arguments and the final recommendation's evidence references.</p></div><div className="atlas-run-grid"><div className="atlas-run-trace">{result.trace.map((step, i) => <div className="is-complete" key={step.evidenceId}><span>{i + 1}</span><p><strong>{step.tool.replaceAll("_", " ")}</strong><small>{step.summary} · {step.evidenceId}{result.plan.evidenceIds.includes(step.evidenceId) ? " · cited in plan" : ""}</small></p></div>)}</div><aside className="atlas-run-console"><div className="atlas-console-head"><span>Run telemetry</span><i>Live</i></div><dl className="atlas-telemetry">{[["Model", result.model], ["Model calls", result.metrics.modelCalls], ["Tool calls", result.metrics.toolCalls], ["Elapsed", (result.metrics.latencyMs / 1000).toFixed(1) + "s"], ["Input / output tokens", result.metrics.inputTokens + " / " + result.metrics.outputTokens], ["Provider retries", result.metrics.providerRetries]].map(([label, value]) => <div key={label as string}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="atlas-help">Run ID: {result.runId}</p><p className="atlas-help">No hidden enterprise integrations or autonomous actions. Tool results are synthetic scenario evidence; customer assumptions require validation.</p><button type="button" className="atlas-button atlas-button-primary atlas-full" onClick={() => setView("plan")}>Back to deployment plan →</button></aside></div></div>}
    </div></section>
  </main>;
}
