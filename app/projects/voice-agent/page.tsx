import { ProjectEvaluation } from "@/components/project-evaluation";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { VoiceAgentDemo } from "@/components/voice-agent-demo";

export const metadata = {
  title: "Voiceprint Studio — Personalized Content Voice Agent",
  description: "A content voice agent that learns writing style from prior posts, retrieves the most relevant examples, drafts in that style, and evaluates the result.",
};

export default function VoiceAgentPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · personalization · RAG · evals</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">Voiceprint Studio</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">Give the system a creator or brand&apos;s past writing and a new content brief. It learns the recurring voice, retrieves the most relevant examples, writes a fresh draft, checks whether it actually sounds right, and revises once when the evaluation is weak.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Problem</p><p className="mt-3 text-sm leading-6">Generic AI copy often sounds polished but not recognizably like the person or brand publishing it.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product</p><p className="mt-3 text-sm leading-6">A style-aware drafting workflow that learns from prior content without simply copying phrases.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What it demonstrates</p><p className="mt-3 text-sm leading-6">Embeddings, retrieval, prompt engineering, orchestration, model-based evaluation, privacy, and copy-risk controls.</p></div>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Collect examples", body: "The user pastes prior posts or scripts. The public demo processes them ephemerally and does not persist them." },
              { title: "Build a style profile", body: "A model extracts reusable patterns such as rhythm, formality, structure, point of view, and rhetorical habits." },
              { title: "Retrieve the best examples", body: "OpenAI embeddings represent the new brief and past samples as vectors; cosine similarity selects the most relevant style examples." },
              { title: "Generate a new draft", body: "The generator receives the brief, style profile, and retrieved examples with explicit rules against verbatim copying." },
              { title: "Evaluate the draft", body: "A separate judge scores style fidelity, brief adherence, platform fit, and originality. A deterministic overlap check looks for copied phrases." },
              { title: "Revise once when needed", body: "If a score falls below the quality gate or copy risk is high, the orchestrator performs one targeted revision." },
            ]}
            toolGroups={[
              { label: "Live in this project", items: ["GPT-5.6 Luna", "text-embedding-3-small", "RAG", "Prompt engineering", "LLM-as-judge", "Cosine similarity"] },
              { label: "Engineering controls", items: ["Deterministic copy check", "No persistence", "Input validation", "Timeouts", "Structured scorecard"] },
              { label: "Production extension", items: ["pgvector", "Creator profiles", "Versioned prompts", "Feedback loop", "A/B tests", "Observability"] },
            ]}
          />

          <ProjectEvaluation
            summary="The key question is not 'did the model produce nice writing?' It is whether the draft matches the intended voice, fulfills the brief, fits the channel, stays original, and improves with feedback. The live workflow already runs a judge plus a deterministic copy check; the repository evaluation plan adds curated golden examples and repeated trials."
            metrics={[
              { name: "Style fidelity", plain: "Does the output match recurring tone and structure from the examples without parroting them?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Brief adherence", plain: "Did the output actually cover the requested topic and constraints?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Originality", plain: "Is the draft new rather than copied from a source sample?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Longest copied phrase", plain: "A hard check counts the longest identical token sequence shared with any example.", method: "Deterministic", target: "< 8 tokens" },
              { name: "Human preference", plain: "When two versions are shown blindly, would the creator choose the personalized version?", method: "Human review", target: "> 70%" },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <VoiceAgentDemo />
        </div>
      </section>
    </main>
  );
}
