import { ProjectEvaluation } from "@/components/project-evaluation";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { VoiceAgentDemo } from "@/components/voice-agent-demo";

export const metadata = {
  title: "Voiceprint Studio — Personalized Content Voice Agent",
  description: "A content voice agent that learns writing style from prior posts, retrieves relevant examples with browser-local Hugging Face embeddings, drafts in that style, and evaluates the result.",
};

export default function VoiceAgentPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · personalization · RAG · local ML · evals</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">Voiceprint Studio</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">Give the system a creator or brand&apos;s past writing and a new content brief. It learns the recurring voice, retrieves the most relevant examples, writes a fresh draft, checks whether it actually sounds right, and revises once when the evaluation is weak.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Problem</p><p className="mt-3 text-sm leading-6">Generic AI copy often sounds polished but not recognizably like the person or brand publishing it.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product</p><p className="mt-3 text-sm leading-6">A style-aware drafting workflow that learns from prior content without simply copying phrases.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What it demonstrates</p><p className="mt-3 text-sm leading-6">Local embeddings, semantic retrieval, prompt engineering, multi-provider model routing, evaluation, privacy, and copy-risk controls.</p></div>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Collect examples", body: "The user pastes prior posts or scripts. The public demo processes them ephemerally and does not persist them." },
              { title: "Embed locally in the browser", body: "Hugging Face Transformers.js runs Xenova/bge-small-en-v1.5 on-device. This removes a remote embedding API dependency and keeps the retrieval step available even when provider quotas are busy." },
              { title: "Retrieve the best examples", body: "The new brief and past samples are represented as normalized vectors; cosine similarity ranks the examples that are most relevant to the new content request." },
              { title: "Learn the voice and generate", body: "The generator extracts reusable style patterns and creates a fresh draft using the brief plus retrieved examples, with explicit rules against verbatim copying." },
              { title: "Evaluate with a separate model path", body: "The evaluator scores style fidelity, brief adherence, platform fit, and originality. When Hugging Face hosted inference is configured, an independent open model can judge an OpenAI-generated draft." },
              { title: "Apply deterministic gates", body: "A code-based longest-shared-phrase check can override a generous model score when the draft copies too much. Low scores trigger one targeted revision." },
            ]}
            toolGroups={[
              { label: "Live in this project", items: ["Hugging Face Transformers.js", "Xenova/bge-small-en-v1.5", "OpenAI Responses API", "RAG", "Cosine similarity", "LLM-as-judge"] },
              { label: "Multi-model provider layer", items: ["OpenAI GPT-5.6 Luna", "DeepSeek V4 Flash via Hugging Face", "GLM-5.3 via Hugging Face", "Retry/backoff", "Provider fallback"] },
              { label: "Engineering controls", items: ["Deterministic copy check", "Browser-local ML", "No persistence", "Input validation", "Timeouts", "Structured scorecard"] },
              { label: "Production extension", items: ["pgvector", "Creator profiles", "Versioned prompts", "Feedback loop", "A/B tests", "Observability"] },
            ]}
            note="The local embedding model is intentionally smaller than a frontier embedding model because it must run reliably in a normal browser. The repository also supports hosted model providers for larger-generation and evaluation models."
          />

          <ProjectEvaluation
            summary="The key question is not 'did the model produce nice writing?' It is whether the draft matches the intended voice, fulfills the brief, fits the channel, stays original, and improves with feedback. The live workflow combines model-based judging with deterministic copy-risk checks so a fluent evaluator cannot excuse verbatim reuse."
            metrics={[
              { name: "Style fidelity", plain: "Does the output match recurring tone and structure from the examples without parroting them?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Brief adherence", plain: "Did the output actually cover the requested topic and constraints?", method: "LLM judge", target: "≥ 4/5" },
              { name: "Originality", plain: "Is the draft new rather than copied from a source sample? The model score is combined with a hard phrase-copy gate.", method: "Composite", target: "≥ 4/5" },
              { name: "Longest copied phrase", plain: "A hard check counts the longest identical token sequence shared with any example.", method: "Deterministic", target: "< 8 tokens" },
              { name: "Retrieval robustness", plain: "Can semantic retrieval work without depending on a remote embedding request?", method: "Reliability test", target: "No remote embedding dependency" },
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
