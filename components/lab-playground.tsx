"use client";

import { useMemo, useState } from "react";
import type { LabSlug } from "@/lib/site";

type TraceStep = { tool: string; status: "ok" | "guarded"; detail: string };
type Demo = {
  prompts: string[];
  answer: (prompt: string) => {
    headline: string;
    response: string;
    trace: TraceStep[];
    evidence: string[];
    metrics: Array<[string, string]>;
  };
};

const demos: Record<LabSlug, Demo> = {
  "context-ops": {
    prompts: ["Can everyone access the Q3 pricing playbook?", "What changed in the onboarding policy and who owns it?", "Create a summary of the launch process for a new sales hire."],
    answer: (prompt) => {
      if (prompt.includes("everyone")) return {
        headline: "Access is restricted to the Revenue Enablement group.",
        response: "I found the pricing playbook in the Revenue Enablement collection. The document is marked restricted, so I would not expose its contents to a user outside that group. I can still report that the resource exists and route an access request.",
        trace: [
          { tool: "identity.resolve", status: "ok", detail: "Resolved demo user → Sales Operations" },
          { tool: "policy.check", status: "guarded", detail: "Revenue Enablement membership required" },
          { tool: "search.hybrid", status: "ok", detail: "3 candidates retrieved; 1 policy-valid" },
          { tool: "answer.compose", status: "ok", detail: "Generated from allowed metadata only" },
        ],
        evidence: ["Collection ACL: Revenue Enablement", "Doc metadata: Q3 pricing playbook", "Policy rule: deny-content / allow-existence"],
        metrics: [["Groundedness", "0.97"], ["Policy compliance", "1.00"], ["Tool calls", "4"], ["Est. cost", "$0.000"]],
      };
      if (prompt.includes("changed")) return {
        headline: "Two material changes: approval ownership and SLA.",
        response: "The latest onboarding policy moves final approval from IT Operations to Identity Governance and changes the standard access-review SLA from two business days to one. The policy owner is People Systems. I would surface both versions so the user can verify the diff.",
        trace: [
          { tool: "search.hybrid", status: "ok", detail: "Retrieved current + previous policy versions" },
          { tool: "policy.check", status: "ok", detail: "Both sources allowed" },
          { tool: "document.diff", status: "ok", detail: "2 substantive changes detected" },
          { tool: "citation.verify", status: "ok", detail: "Every claim mapped to source span" },
        ],
        evidence: ["Onboarding Policy v18", "Onboarding Policy v17", "People Systems ownership registry"],
        metrics: [["Context precision", "0.92"], ["Answer relevance", "0.95"], ["Citation coverage", "100%"], ["Latency", "418 ms"]],
      };
      return {
        headline: "A five-step launch path with one approval gate.",
        response: "For a new sales hire: confirm worker identity, provision baseline access, request role-specific tools, complete manager approval for restricted systems, then verify access through the day-one checklist. I would keep the approval step explicit rather than letting the agent auto-grant access.",
        trace: [
          { tool: "search.hybrid", status: "ok", detail: "6 chunks retrieved across 3 sources" },
          { tool: "rerank.context", status: "ok", detail: "Reduced to 4 high-signal chunks" },
          { tool: "workflow.map", status: "ok", detail: "5 ordered steps, 1 protected action" },
          { tool: "policy.check", status: "guarded", detail: "Restricted grants require manager approval" },
        ],
        evidence: ["New Hire Runbook", "Access Control Standard", "Sales Systems Checklist"],
        metrics: [["Faithfulness", "0.96"], ["Answer relevance", "0.93"], ["Protected actions", "1"], ["Latency", "392 ms"]],
      };
    },
  },
  "solution-architect": {
    prompts: ["A 1,500-person support org wants an AI agent to cut ticket handle time.", "A bank wants RAG over policy documents with strict permissions.", "A sales team wants an AI copilot but cannot quantify ROI yet."],
    answer: (prompt) => ({
      headline: prompt.includes("bank") ? "Lead with authorization architecture, not model selection." : prompt.includes("ROI") ? "Instrument the workflow before promising savings." : "Pilot the highest-volume, lowest-risk resolution path first.",
      response: prompt.includes("bank") ? "I would treat identity, document ACL propagation, auditability, and evaluation evidence as launch blockers. The pilot should begin read-only, with retrieval filtered before generation and a benchmark set that includes permission-negative tests." : prompt.includes("ROI") ? "Baseline current rep time across research, drafting, CRM entry, and follow-up. Then choose one measurable workflow, define adoption and quality thresholds, and model ROI from observed time saved instead of assumed model productivity." : "Start with one ticket family that has repeatable source-of-truth data. Build retrieval plus bounded tools, measure handle-time delta and escalation rate, and expand only after quality and adoption thresholds are met.",
      trace: [
        { tool: "brief.parse", status: "ok", detail: "Goals, constraints, unknowns extracted" },
        { tool: "discovery.gaps", status: "ok", detail: "5 unanswered deployment questions" },
        { tool: "architecture.generate", status: "ok", detail: "Pilot architecture assembled from reusable patterns" },
        { tool: "roi.model", status: "ok", detail: "Value hypothesis tied to measurable workflow baseline" },
      ],
      evidence: ["Discovery checklist", "AI deployment risk matrix", "Pilot economics template"],
      metrics: [["Open questions", "5"], ["Pilot phases", "3"], ["Risk gates", "4"], ["Value metric", "cycle time"]],
    }),
  },
  "incident-commander": {
    prompts: ["RAG answer quality dropped after yesterday's content sync.", "Agent latency doubled but model latency is unchanged.", "A tool-writing agent created duplicate tickets."],
    answer: (prompt) => {
      const duplicate = prompt.includes("duplicate");
      const latency = prompt.includes("latency");
      return {
        headline: duplicate ? "Disable writes first; preserve read-only diagnosis." : latency ? "The bottleneck is likely outside inference." : "Compare retrieval distribution before and after the sync.",
        response: duplicate ? "I would trip the write-action circuit breaker, preserve the run traces, and inspect idempotency keys plus retry behavior. Do not ask the model to 'be more careful'; enforce duplicate protection in the tool contract." : latency ? "Because model latency is flat, inspect retrieval, tool fan-out, network calls, and serial execution. The safest first optimization is to identify newly sequential steps before changing model or timeout settings." : "First compare chunk counts, metadata coverage, ACL filtering, and top-k similarity before versus after the sync. If retrieval changed sharply, roll back the index snapshot while investigating ingestion rather than tuning the prompt.",
        trace: [
          { tool: "telemetry.query", status: "ok", detail: "Loaded current + baseline run metrics" },
          { tool: "trace.compare", status: "ok", detail: "Isolated changed subsystem" },
          { tool: "runbook.match", status: "ok", detail: "Matched reversible mitigation path" },
          { tool: "action.guard", status: duplicate ? "guarded" : "ok", detail: duplicate ? "Write tools disabled pending review" : "No destructive action proposed" },
        ],
        evidence: ["Run traces", "Deployment changelog", "Service health metrics"],
        metrics: [["Confidence", "0.88"], ["Reversible first step", "yes"], ["Write risk", duplicate ? "high" : "low"], ["Escalation", duplicate ? "required" : "conditional"]],
      };
    },
  },
};

export function LabPlayground({ slug }: { slug: LabSlug }) {
  const demo = demos[slug];
  const [prompt, setPrompt] = useState(demo.prompts[0]);
  const [executedPrompt, setExecutedPrompt] = useState(demo.prompts[0]);
  const result = useMemo(() => demo.answer(executedPrompt), [demo, executedPrompt]);

  return <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]"><div className="grid md:grid-cols-[0.9fr_1.4fr]">
    <div className="border-b border-[var(--line)] p-5 md:border-b-0 md:border-r md:p-7"><div className="mb-5 flex items-center justify-between"><p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Demo console</p><span className="rounded-full bg-[var(--signal-soft)] px-2.5 py-1 font-mono text-[10px] text-[var(--signal)]">NO API KEY</span></div><label htmlFor={`scenario-${slug}`} className="text-sm font-medium">Scenario</label><select id={`scenario-${slug}`} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-sm outline-none" value={prompt} onChange={(e) => setPrompt(e.target.value)}>{demo.prompts.map((p) => <option key={p}>{p}</option>)}</select><button onClick={() => setExecutedPrompt(prompt)} className="mt-4 w-full rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition hover:opacity-85">Run agent</button><div className="mt-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Tool trace</p><div className="mt-3 space-y-2">{result.trace.map((step, i) => <div key={`${step.tool}-${i}`} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3"><div className="flex items-center justify-between gap-3"><code className="text-xs">{step.tool}</code><span className={`font-mono text-[10px] ${step.status === "guarded" ? "text-[var(--orange)]" : "text-[var(--green)]"}`}>{step.status === "guarded" ? "GUARDED" : "OK"}</span></div><p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{step.detail}</p></div>)}</div></div></div>
    <div className="p-5 md:p-7"><p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Agent output</p><h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{result.headline}</h3><p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">{result.response}</p><div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{result.metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--line)] p-3"><p className="font-mono text-sm font-semibold">{value}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{label}</p></div>)}</div><div className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Evidence</p><div className="mt-3 flex flex-wrap gap-2">{result.evidence.map((item, i) => <span key={item} className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs">[{i + 1}] {item}</span>)}</div></div><div className="mt-7 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-4 text-xs leading-5 text-[var(--muted)]">This demo intentionally uses deterministic synthetic data so it is always inspectable. The same tool contracts can be connected to an LLM provider through the optional runtime adapter without changing the UI or safety boundaries.</div></div>
  </div></div>;
}
