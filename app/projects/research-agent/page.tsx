import { ProjectEvaluation } from "@/components/project-evaluation";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { ResearchAgentDemo } from "@/components/research-agent-demo";

export const metadata = {
  title: "SignalBrief — Multi-Source Research Agent",
  description: "A goal-aware research agent that searches multiple public source types, synthesizes what matters, cites evidence, and grades its own digest.",
};

export default function ResearchAgentPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · web research · synthesis · evals</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">SignalBrief</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">A research agent for people who do not need more links — they need to know which signals matter for a specific goal. It searches across public community discussions, newsletter/blog analysis, public LinkedIn posts when indexable, and primary technical sources, then turns the evidence into a concise action-oriented brief.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Problem</p><p className="mt-3 text-sm leading-6">People can spend hours scanning communities and newsletters but still miss the few developments that are actually relevant to their work.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product</p><p className="mt-3 text-sm leading-6">A research workflow that uses a professional goal as the ranking function for what deserves attention.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What it demonstrates</p><p className="mt-3 text-sm leading-6">Web search tools, source provenance, synthesis, source diversity, freshness, goal personalization, and model-based evaluation.</p></div>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Define the goal", body: "The user explains what they are trying to achieve. The same news can be useful for one goal and noise for another." },
              { title: "Plan source coverage", body: "The research prompt explicitly seeks Reddit, newsletter/blog, public LinkedIn, and primary technical evidence rather than relying on one feed." },
              { title: "Search the live web", body: "GPT-5.6 Terra uses OpenAI's web-search tool and returns traceable source URLs." },
              { title: "Filter and synthesize", body: "The model keeps only signals that matter to the goal, resolves obvious conflicts, and prefers original sources for factual claims." },
              { title: "Turn research into action", body: "Each signal includes why it matters and one concrete action or talking point." },
              { title: "Evaluate the digest", body: "A separate judge scores relevance, synthesis, actionability, diversity, and citation coverage. Missing source categories are surfaced explicitly." },
            ]}
            toolGroups={[
              { label: "Live in this project", items: ["GPT-5.6 Terra", "OpenAI web search", "Source citations", "Goal-aware prompting", "LLM-as-judge"] },
              { label: "Research controls", items: ["Source coverage", "Primary-source preference", "Freshness instruction", "Contradiction handling", "No fabricated coverage"] },
              { label: "Production extension", items: ["Vercel Cron", "PostgreSQL", "Deduplication store", "Email/Slack delivery", "Feedback loop", "Online evals"] },
            ]}
            note="LinkedIn does not provide an unrestricted public scraping interface. The demo uses public web indexing when available and reports the gap when it cannot access a source; a production version would use an approved API/export/connector rather than scrape authenticated pages."
          />

          <ProjectEvaluation
            summary="Research quality is multi-dimensional. A digest can be factually correct but useless, well written but poorly sourced, or diverse but irrelevant. The evaluation therefore scores the final output and the source set separately."
            metrics={[
              { name: "Goal relevance", plain: "Would this item genuinely help the specific professional goal, or is it generic trend noise?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Synthesis", plain: "Does the brief connect evidence and explain meaning instead of listing links?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Actionability", plain: "Does each major signal lead to a useful next step or talking point?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Source diversity", plain: "Are independent source types represented without rewarding low-quality sources just for variety?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Citation coverage", plain: "Can factual claims be traced back to the sources returned by web search?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Source-category coverage", plain: "The runtime reports which requested source categories were actually found or indexable.", method: "Deterministic", target: "No silent gaps" },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <ResearchAgentDemo />
        </div>
      </section>
    </main>
  );
}
