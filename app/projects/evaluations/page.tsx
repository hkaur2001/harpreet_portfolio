import Link from "next/link";
import { ProjectEvaluation } from "@/components/project-evaluation";

export const metadata = {
  title: "Evaluation Methodology",
  description: "How the portfolio evaluates AI systems with deterministic checks, model-based graders, human review, datasets, slices, and release gates.",
};

const projects = [
  {
    title: "Sentinel",
    summary: "Incident-response quality is not just whether the final diagnosis sounds plausible. The evaluation checks the trajectory, evidence, safety boundary, and recovery behavior.",
    metrics: [
      { name: "Root-cause class", plain: "Did the investigation identify the correct failure domain?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Tool trajectory", plain: "Were the tools chosen in a defensible order given the observations available at each step?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Policy bypass", plain: "Can a high-risk action execute without the required approval?", method: "Deterministic" as const, target: "0" },
      { name: "Injection resistance", plain: "Does malicious text inside logs remain untrusted data?", method: "Deterministic" as const, target: "100% pass" },
    ],
  },
  {
    title: "Secure Knowledge Assistant",
    summary: "RAG is evaluated as two systems: retrieval and generation. Permission compliance is a separate hard gate because a helpful answer is still a failure if it used restricted evidence.",
    metrics: [
      { name: "Retrieval relevance", plain: "Did the retriever select documents that actually help answer the question?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Groundedness", plain: "Can the answer's factual claims be supported by retrieved documents?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Citation coverage", plain: "Are material claims linked back to source IDs?", method: "Deterministic" as const, target: "100%" },
      { name: "Permission leakage", plain: "Did any inaccessible document enter the model context or answer?", method: "Deterministic" as const, target: "0" },
    ],
  },
  {
    title: "Voiceprint Studio",
    summary: "Personalization requires both subjective and objective grading. A draft can feel on-brand but still copy source wording, so the system combines an LLM judge with a deterministic overlap detector and human blind preference.",
    metrics: [
      { name: "Style fidelity", plain: "Does the draft match recurring tone and structure rather than generic AI copy?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Brief adherence", plain: "Did it actually deliver the requested message and constraints?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Copy-risk guard", plain: "What is the longest exact token sequence reused from a source sample?", method: "Deterministic" as const, target: "< 8 tokens" },
      { name: "Blind preference", plain: "Would the creator choose the personalized draft over a generic baseline without knowing which is which?", method: "Human review" as const, target: "> 70%" },
    ],
  },
  {
    title: "SignalBrief",
    summary: "A research digest can fail by being irrelevant, poorly sourced, repetitive, stale, or impossible to act on. Those dimensions are measured separately.",
    metrics: [
      { name: "Goal relevance", plain: "Does each major item matter to the user's stated professional goal?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Synthesis", plain: "Does the digest connect evidence and explain meaning instead of listing links?", method: "LLM judge" as const, target: "≥ 4/5" },
      { name: "Source coverage", plain: "Which requested source categories were actually found and indexable?", method: "Deterministic" as const, target: "No silent gaps" },
      { name: "Citation coverage", plain: "Are factual claims traceable to returned sources?", method: "LLM judge" as const, target: "≥ 4/5" },
    ],
  },
  {
    title: "AI Policy Radar",
    summary: "This is mostly conventional software, so its quality gates are deterministic data and reliability checks instead of model-based grading.",
    metrics: [
      { name: "Primary-source provenance", plain: "Does every displayed record point back to the original Federal Register source?", method: "Deterministic" as const, target: "100%" },
      { name: "Normalization", plain: "Are required fields such as title, date, agency, type, and URL represented consistently?", method: "Deterministic" as const, target: "100%" },
      { name: "Upstream failure", plain: "If the source API fails, does the UI show a degraded state rather than inventing data?", method: "Deterministic" as const, target: "100% pass" },
      { name: "Usefulness", plain: "Does the product reduce the time needed to notice relevant policy changes?", method: "Product metric" as const, target: "Measure with users" },
    ],
  },
];

export default function EvaluationsPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Evaluation methodology</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">Evals turn “this seems good” into a repeatable engineering decision.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">For each system I define the job, create representative test cases, measure the failure modes that matter, slice results by scenario, and turn critical metrics into release gates. Subjective qualities use rubric-driven model graders and human review; security and data-integrity rules stay deterministic.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Deterministic checks", "Use code when the answer should be objectively pass/fail: permissions, schemas, citations, approval rules, source URLs."],
              ["LLM-as-judge", "Use a separate model with a clear rubric for semantic qualities such as groundedness, relevance, style, or synthesis."],
              ["Human + product signals", "Use people and real outcomes for taste, usefulness, adoption, edit rate, task completion, and high-impact decisions."],
            ].map(([title, body]) => <div key={title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p></div>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/projects" className="btn-primary rounded-full px-5">Back to selected projects</Link><a href="https://github.com/hkaur2001/harpreet_portfolio/tree/main/evals" target="_blank" rel="noreferrer" className="btn-secondary">Evaluation dataset + methodology ↗</a></div>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">The loop</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-6">{["Specify good", "Build golden set", "Run trials", "Grade components", "Slice failures", "Improve + repeat"].map((step, index) => <div key={step} className="rounded-xl bg-[var(--bg)] p-4"><span className="font-mono text-xs text-[var(--signal)]">0{index + 1}</span><p className="mt-3 text-sm font-semibold">{step}</p></div>)}</div>
          </div>
          <div className="mt-8 space-y-4">{projects.map((project) => <div key={project.title} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><h2 className="text-2xl font-semibold tracking-[-0.03em]">{project.title}</h2><ProjectEvaluation title="Open evaluation plan" summary={project.summary} metrics={project.metrics} /></div>)}</div>
        </div>
      </section>
    </main>
  );
}
