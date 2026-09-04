"use client";

import { useState } from "react";

type ResearchResult = {
  digest: string;
  sources: Array<{ title: string; url: string; sourceType: string }>;
  evaluation: { relevance: number; synthesis: number; actionability: number; sourceDiversity: number; citationCoverage: number; notes: string };
  coverage: string[];
  metrics: { model: string; searchTool: string; latencyMs: number; sourceCount: number };
};

export function ResearchAgentDemo() {
  const [goal, setGoal] = useState("I am preparing for Forward Deployed Engineer and Applied AI interviews. Find technical discussions from the last week that would help me understand what strong production AI teams care about right now.");
  const [topics, setTopics] = useState("agent evals, MCP, RAG, production reliability, AI infrastructure");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/research-agent/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal, topics }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Research could not complete.");
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research could not complete.");
    } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Research brief</p>
        <label htmlFor="goal" className="mt-5 block text-sm font-semibold">Professional goal</label>
        <textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} rows={7} className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm outline-none focus:border-[var(--ink)]" />
        <label htmlFor="topics" className="mt-5 block text-sm font-semibold">Topics to monitor</label>
        <textarea id="topics" value={topics} onChange={(e) => setTopics(e.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm outline-none focus:border-[var(--ink)]" />
        <div className="mt-5 rounded-2xl bg-[var(--bg)] p-4 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Source policy:</strong> the agent searches the public web for Reddit discussions, newsletter/blog posts, public LinkedIn posts when indexable, and primary technical sources. It reports source gaps instead of pretending a closed or inaccessible source was searched.</div>
        <button onClick={run} disabled={loading} className="btn-primary mt-6 w-full rounded-full px-5 disabled:opacity-60">{loading ? "Researching sources…" : "Build my research brief →"}</button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        {!result ? <div className="grid min-h-[520px] place-items-center text-center"><div><p className="text-lg font-semibold">The goal controls what counts as useful.</p><p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">A general trend summary is easy. This agent is evaluated on whether it finds evidence that is specifically useful for the professional goal you gave it.</p></div></div> : <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Personalized digest</p>
          <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[var(--bg)] p-5 text-sm leading-7">{result.digest}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Relevance", result.evaluation.relevance], ["Synthesis", result.evaluation.synthesis], ["Actionability", result.evaluation.actionability], ["Diversity", result.evaluation.sourceDiversity], ["Citations", result.evaluation.citationCoverage]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-[var(--bg)] p-3"><p className="text-2xl font-semibold">{value}/5</p><p className="mt-1 text-[11px] text-[var(--muted)]">{label}</p></div>)}</div>
          <details className="mt-5 rounded-2xl border border-[var(--line)] p-4"><summary className="cursor-pointer font-semibold">Sources used <span className="float-right">+</span></summary><div className="mt-4 space-y-2">{result.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl bg-[var(--bg)] p-3 text-sm hover:underline"><span className="mr-2 font-mono text-[10px] uppercase text-[var(--signal)]">{source.sourceType}</span>{source.title || source.url}</a>)}</div></details>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Coverage: {result.coverage.join(" · ")} · {result.metrics.sourceCount} sources · {result.metrics.model} + {result.metrics.searchTool} · {result.metrics.latencyMs} ms</p>
        </div>}
      </div>
    </div>
  );
}
