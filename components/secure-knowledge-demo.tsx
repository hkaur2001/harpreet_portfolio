"use client";

import { useState } from "react";

type Result = {
  answer: string;
  sources: Array<{ id: string; title: string; owner: string; score: number }>;
  trace: Array<[string, string]>;
  metrics: {
    retrievalMode: string;
    embeddingTokens: number;
    blockedCount: number;
    latencyMs: number;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
  };
};

const examples = [
  "Who approves restricted access for a new employee?",
  "What is the standard access review SLA?",
  "What does the Q3 pricing playbook say about discount exceptions?",
];

export function SecureKnowledgeDemo() {
  const [question, setQuestion] = useState(examples[0]);
  const [persona, setPersona] = useState("employee");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/knowledge/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, persona }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The request failed.");
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--signal)]">Try the product</p>
        <h3 className="mt-3 text-2xl font-semibold">Ask the same knowledge base as different users.</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">The identity changes what the retrieval layer is allowed to search. The model only receives documents that passed the access filter.</p>

        <label htmlFor="persona" className="mt-6 block text-sm font-semibold">Identity</label>
        <select id="persona" value={persona} onChange={(event) => setPersona(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-sm">
          <option value="employee">General employee</option>
          <option value="sales">Sales operations user</option>
          <option value="revenue">Revenue enablement user</option>
        </select>

        <label htmlFor="knowledge-question" className="mt-5 block text-sm font-semibold">Question</label>
        <textarea id="knowledge-question" rows={4} value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-sm leading-6" />

        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((example) => <button type="button" key={example} onClick={() => setQuestion(example)} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-left text-[11px] text-[var(--muted)] hover:text-[var(--ink)]">{example}</button>)}
        </div>

        <button type="button" onClick={run} disabled={loading} className="btn-primary mt-6 w-full rounded-xl disabled:cursor-wait disabled:opacity-60">{loading ? "Retrieving authorized sources…" : "Run secure retrieval"}</button>
        {error && <p role="alert" className="mt-4 text-sm text-[var(--orange)]">{error}</p>}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--signal)]">Result + execution trace</p>
        {!result && !loading && <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center"><div><p className="font-semibold">No query has run yet.</p><p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Try the pricing question first as a general employee, then switch to Revenue Enablement and run it again.</p></div></div>}
        {loading && <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center"><div><div className="mx-auto size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--signal)]" /><p className="mt-4 font-semibold">Embedding, filtering, retrieving, and grounding…</p></div></div>}
        {result && <div className="mt-6 space-y-5">
          <div className="rounded-2xl bg-[var(--bg)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Answer</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{result.answer}</p></div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">How this request moved through the system</p>
            <div className="mt-3 space-y-2">{result.trace.map(([title, body], index) => <div key={`${title}-${index}`} className="grid grid-cols-[32px_1fr] gap-3 rounded-xl border border-[var(--line)] p-3"><span className="font-mono text-[10px] text-[var(--signal)]">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{body}</p></div></div>)}</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--soft)] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Retrieval</p><p className="mt-2 text-sm font-semibold">{result.metrics.retrievalMode}</p></div>
            <div className="rounded-xl bg-[var(--soft)] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Generation</p><p className="mt-2 text-sm font-semibold">{result.metrics.model}</p></div>
            <div className="rounded-xl bg-[var(--soft)] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Access filter</p><p className="mt-2 text-sm font-semibold">{result.metrics.blockedCount} unavailable source(s) excluded</p></div>
            <div className="rounded-xl bg-[var(--soft)] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Latency</p><p className="mt-2 text-sm font-semibold">{result.metrics.latencyMs} ms</p></div>
          </div>

          {result.sources.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Authorized sources used</p><div className="mt-3 space-y-2">{result.sources.map((source) => <div key={source.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] p-3"><div><p className="text-sm font-semibold">{source.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{source.owner} · {source.id}</p></div><span className="font-mono text-[10px] text-[var(--muted)]">{source.score.toFixed(3)}</span></div>)}</div></div>}
        </div>}
      </section>
    </div>
  );
}
