type Metric = {
  name: string;
  plain: string;
  method: "Deterministic" | "LLM judge" | "Human review" | "Product metric" | "Composite" | "Reliability test";
  target: string;
};

export function ProjectEvaluation({
  title = "How I evaluate it",
  summary,
  metrics,
}: {
  title?: string;
  summary: string;
  metrics: Metric[];
}) {
  return (
    <details className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 md:p-6">
      <summary className="cursor-pointer list-none font-semibold">{title} <span className="float-right text-[var(--muted)]">+</span></summary>
      <div className="mt-5 border-t border-[var(--line)] pt-5">
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">{summary}</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)]">
          {metrics.map((metric) => (
            <div key={metric.name} className="grid gap-2 border-b border-[var(--line)] bg-[var(--surface)] p-4 last:border-b-0 md:grid-cols-[0.75fr_1.4fr_0.65fr_0.55fr] md:items-start">
              <p className="text-sm font-semibold">{metric.name}</p>
              <p className="text-xs leading-5 text-[var(--muted)]">{metric.plain}</p>
              <span className="text-xs">{metric.method}</span>
              <span className="font-mono text-xs text-[var(--signal)]">{metric.target}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Industry-style evaluation mixes hard checks, model-based scoring, reliability tests, product outcomes, and human review. A single score is rarely enough: each project needs metrics tied to its actual failure modes.</p>
      </div>
    </details>
  );
}
