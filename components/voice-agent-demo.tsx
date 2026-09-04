"use client";

import { useState } from "react";

type VoiceResult = {
  draft: string;
  styleProfile: string;
  retrieved: Array<{ index: number; score: number; excerpt: string }>;
  evaluation: {
    styleFidelity: number;
    briefAdherence: number;
    platformFit: number;
    originality: number;
    copyRisk: string;
    revisionPerformed: boolean;
  };
  metrics: { model: string; retrieval: string; latencyMs: number; sampleCount: number };
};

const starter = `I keep seeing teams reach for more AI before they have made the workflow observable. The model is rarely the only thing that needs debugging.\n---\nA good automation should make the boring path boring. The interesting engineering is in the exceptions: permissions, retries, ownership, and recovery.\n---\nThe best product demos answer one question quickly: what changed for the user after this existed? Architecture matters, but the outcome should still be obvious.`;

export function VoiceAgentDemo() {
  const [samples, setSamples] = useState(starter);
  const [brief, setBrief] = useState("Write a LinkedIn post about why evaluation should be designed before an AI feature launches.");
  const [format, setFormat] = useState("LinkedIn post");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/voice-agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples, brief, format }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The voice workflow failed.");
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The voice workflow failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">1 · Give it examples</p>
        <label className="mt-5 block text-sm font-semibold" htmlFor="samples">Past posts or scripts</label>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Paste at least three examples. Separate samples with a line containing <code>---</code>. Nothing is stored by this demo.</p>
        <textarea id="samples" value={samples} onChange={(e) => setSamples(e.target.value)} rows={12} className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm outline-none focus:border-[var(--ink)]" />

        <label className="mt-5 block text-sm font-semibold" htmlFor="brief">What should it create?</label>
        <textarea id="brief" value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm outline-none focus:border-[var(--ink)]" />

        <label className="mt-5 block text-sm font-semibold" htmlFor="format">Format</label>
        <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3 text-sm">
          <option>LinkedIn post</option>
          <option>Instagram caption</option>
          <option>Short video script</option>
          <option>Email intro</option>
        </select>
        <button onClick={run} disabled={loading} className="btn-primary mt-6 w-full rounded-full px-5 disabled:opacity-60">{loading ? "Learning the voice…" : "Draft in this voice →"}</button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        {!result ? (
          <div className="grid min-h-[520px] place-items-center text-center"><div><p className="text-lg font-semibold">The output is inspectable, not just generated.</p><p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">After a run, this panel shows the learned style profile, which examples were retrieved, the draft, and an evaluation scorecard.</p></div></div>
        ) : (
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Generated draft</p>
            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[var(--bg)] p-5 text-sm leading-7">{result.draft}</div>

            <details className="mt-5 rounded-2xl border border-[var(--line)] p-4">
              <summary className="cursor-pointer font-semibold">What did it learn about the voice? <span className="float-right">+</span></summary>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{result.styleProfile}</p>
            </details>

            <details className="mt-3 rounded-2xl border border-[var(--line)] p-4">
              <summary className="cursor-pointer font-semibold">Which examples did retrieval use? <span className="float-right">+</span></summary>
              <div className="mt-4 space-y-3">{result.retrieved.map((item) => <div key={item.index} className="rounded-xl bg-[var(--bg)] p-3 text-xs leading-5"><div className="flex justify-between gap-4"><span>Sample {item.index + 1}</span><span className="font-mono">similarity {item.score.toFixed(3)}</span></div><p className="mt-2 text-[var(--muted)]">{item.excerpt}</p></div>)}</div>
            </details>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Style", result.evaluation.styleFidelity], ["Brief", result.evaluation.briefAdherence], ["Platform", result.evaluation.platformFit], ["Originality", result.evaluation.originality]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-[var(--bg)] p-3"><p className="text-2xl font-semibold">{value}/5</p><p className="mt-1 text-[11px] text-[var(--muted)]">{label}</p></div>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Model: {result.metrics.model} · retrieval: {result.metrics.retrieval} · {result.metrics.sampleCount} samples · {result.metrics.latencyMs} ms · copy risk: {result.evaluation.copyRisk}{result.evaluation.revisionPerformed ? " · one automatic revision was applied" : ""}</p>
          </div>
        )}
      </div>
    </div>
  );
}
