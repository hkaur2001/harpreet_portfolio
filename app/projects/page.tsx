import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";

export const metadata = {
  title: "Selected Projects",
  description: "Selected projects by Harpreet Kaur across agent systems, RAG, personalization, research, and live data products.",
};

const projects = [
  {
    number: "01",
    title: "Sentinel",
    subtitle: "AI Production Incident Response",
    purpose: "Find the cause of a production failure before changing the wrong thing.",
    body: "Sentinel investigates simulated production incidents by inspecting metrics, logs, deployments, database health, source changes, runbooks, and prior incidents. The model can recommend a remediation, but deterministic policy and human approval control whether it can proceed.",
    href: "/projects/sentinel",
    steps: [
      ["Receive an incident", "Start from a symptom, not a pre-labeled root cause."],
      ["Choose tools", "The model decides which bounded evidence source to inspect next."],
      ["Build a diagnosis", "Observations update the hypothesis and confidence."],
      ["Recommend safely", "Policy code sits between the model and any simulated remediation."],
    ],
    groups: [
      ["AI", ["OpenAI Responses API", "Tool calling", "MCP", "Model routing", "Structured outputs"]],
      ["Backend", ["Python", "FastAPI", "Pydantic", "PostgreSQL", "pgvector"]],
      ["Production", ["Docker", "Kubernetes", "Terraform", "Redis", "GitHub Actions", "Observability"]],
    ],
  },
  {
    number: "02",
    title: "Secure Knowledge Assistant",
    subtitle: "Permission-aware RAG",
    purpose: "Answer from internal knowledge without leaking information the current user cannot access.",
    body: "Identity is resolved before retrieval, inaccessible documents are removed, semantic search runs over the allowed corpus, and the language model receives only authorized evidence.",
    href: "/projects/secure-knowledge",
    steps: [["Resolve identity", "Map the user to trusted groups."], ["Filter first", "Remove inaccessible documents before retrieval."], ["Retrieve semantically", "Use embeddings and vector similarity to rank allowed evidence."], ["Generate with citations", "Answer only from authorized context and expose the sources used."]],
    groups: [["AI", ["RAG", "OpenAI Embeddings", "GPT-5.6 Luna", "Citations", "Evals"]], ["Data", ["PostgreSQL", "pgvector", "Metadata", "ACL filtering"]], ["Security", ["RBAC/ACLs", "OAuth/OIDC patterns", "Least privilege", "Auditability"]]],
  },
  {
    number: "03",
    title: "Voiceprint Studio",
    subtitle: "Personalized Content Voice Agent",
    purpose: "Draft new content that matches a creator or brand's recurring style without copying their old posts.",
    body: "The workflow learns a reusable style profile, retrieves the most relevant prior examples with embeddings, generates a fresh draft, evaluates style fidelity and originality, and revises once when quality falls below the gate.",
    href: "/projects/voice-agent",
    steps: [["Learn the voice", "Extract recurring writing patterns from past examples."], ["Retrieve examples", "Use embeddings to select the examples most relevant to the new brief."], ["Draft", "Generate a new post or script using the style profile and retrieved context."], ["Evaluate and revise", "Score style, brief adherence, platform fit, and copy risk before returning the draft."]],
    groups: [["AI", ["Embeddings", "RAG", "Prompt engineering", "Agentic orchestration", "LLM-as-judge"]], ["Quality", ["Style eval", "Originality check", "Human preference", "Revision loop"]], ["Production", ["Privacy", "Input validation", "Timeouts", "Versioned prompts", "Observability"]]],
  },
  {
    number: "04",
    title: "SignalBrief",
    subtitle: "Multi-Source Research Agent",
    purpose: "Turn a noisy week of online discussion into the few signals that matter for one professional goal.",
    body: "The agent searches public Reddit discussions, newsletter/blog analysis, public LinkedIn posts when indexable, and primary technical sources. It synthesizes evidence into a goal-specific digest and grades the result for relevance, source quality, and actionability.",
    href: "/projects/research-agent",
    steps: [["Define the goal", "Use the user's objective as the ranking function for relevance."], ["Search multiple source types", "Use live web search instead of one closed feed."], ["Synthesize", "Resolve overlap and contradictions, then explain why each signal matters."], ["Evaluate", "Score relevance, synthesis, actionability, diversity, and citation coverage."]],
    groups: [["AI", ["GPT-5.6 Terra", "Web search tool", "Agent prompting", "LLM-as-judge"]], ["Research", ["Freshness", "Source diversity", "Provenance", "Contradiction handling"]], ["Production", ["Cron pattern", "Deduplication", "PostgreSQL", "Feedback loop", "Online evals"]]],
  },
  {
    number: "05",
    title: "AI Policy Radar",
    subtitle: "Live Public-Data Product",
    purpose: "Surface recent U.S. federal AI-related actions without manually searching government sites.",
    body: "Policy Radar reads the Federal Register API, normalizes records, caches responses, preserves primary-source provenance, and fails visibly when the upstream source is unavailable. It intentionally does not use an LLM for a task that does not need one.",
    href: "/projects/policy-radar",
    steps: [["Fetch", "Query the live Federal Register API."], ["Normalize", "Shape dates, agencies, document types, and source URLs into a stable contract."], ["Cache", "Keep the page fresh without wasteful repeated calls."], ["Preserve provenance", "Link every item back to the original government record."]],
    groups: [["Application", ["Next.js", "TypeScript", "Server Components", "REST API"]], ["Data", ["Normalization", "Caching", "Source provenance", "Error handling"]], ["Judgment", ["No unnecessary LLM", "Simple architecture", "Graceful degradation"]]],
  },
] as const;

export default function ProjectsPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected projects</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">Different problems need different systems.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">Each project starts with a plain-language problem. Expand “How does it work?” only when you want the architecture and tool depth.</p>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-16 md:px-8 md:py-24">
          {projects.map((project) => (
            <article key={project.title} className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">{project.number} · {project.subtitle}</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">{project.title}</h2>
                  <p className="mt-5 text-xl font-medium leading-8">{project.purpose}</p>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{project.body}</p>
                  <Link href={project.href} className="btn-primary mt-7 rounded-full px-5">Open project →</Link>
                </div>
                <ProjectHowItWorks
                  steps={project.steps.map(([title, body]) => ({ title, body }))}
                  toolGroups={project.groups.map(([label, items]) => ({ label, items: [...items] }))}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
