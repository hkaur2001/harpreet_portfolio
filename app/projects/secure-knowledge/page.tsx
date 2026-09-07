import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { SecureKnowledgeDemo } from "@/components/secure-knowledge-demo";

export const metadata = {
  title: "Secure Knowledge Assistant",
  description: "A permission-aware RAG system that retrieves only authorized knowledge and returns grounded answers with visible execution steps.",
};

export default function SecureKnowledgePage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · secure RAG · authorization-first retrieval</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">Secure Knowledge Assistant</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">A knowledge assistant should not answer from every document it can find. This project makes identity and permissions part of retrieval itself, ranks only evidence the current user is allowed to see, and gives the language model that authorized context—never the restricted corpus.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Problem</p><p className="mt-3 text-sm leading-6">People need fast answers from internal knowledge, but search cannot leak restricted content across teams.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product</p><p className="mt-3 text-sm leading-6">A permission-aware RAG workflow where changing the user identity changes which sources can even enter retrieval.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">What it demonstrates</p><p className="mt-3 text-sm leading-6">Authorization, hybrid retrieval, grounded generation, citations, abstention, observable traces, and production vector-search architecture.</p></div>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Resolve identity", body: "The server maps the selected persona to trusted groups. Visitors cannot submit arbitrary access groups." },
              { title: "Filter before retrieval", body: "Documents outside that security context are removed first. Restricted text never enters ranking or model context for an unauthorized identity." },
              { title: "Rank authorized evidence", body: "The public fixture uses deterministic hybrid retrieval with weighted terms, phrase matches, normalization, and query expansion. This keeps the security demo repeatable and independent of an embedding API quota." },
              { title: "Generate from authorized context", body: "GPT-5.6 Luna receives only the top allowed sources and is instructed to abstain when evidence is insufficient." },
              { title: "Return citations and trace", body: "The UI shows sources, retrieval mode, blocked-source count, model choice, and request latency so the security boundary is inspectable." },
              { title: "Scale the same boundary", body: "The production reference swaps the tiny fixture for connector ingestion, embedding-based hybrid search, Postgres/pgvector, caching, and audited identity metadata—while preserving the same pre-retrieval ACL boundary." },
            ]}
            toolGroups={[
              { label: "Live in this demo", items: ["Next.js", "TypeScript", "Hybrid retrieval", "GPT-5.6 Luna", "ACL pre-filter", "Citations"] },
              { label: "Implemented / reference architecture", items: ["FastAPI", "Pydantic", "PostgreSQL", "pgvector", "MCP", "Pytest", "GitHub Actions"] },
              { label: "Production extension", items: ["Embeddings", "Redis", "OAuth/OIDC", "Docker", "Kubernetes", "Terraform", "OpenTelemetry"] },
            ]}
            note="The public corpus is intentionally tiny and synthetic, so a deterministic retrieval layer makes the authorization behavior easy to reproduce without relying on a paid embedding request. At enterprise scale, the same ACL-before-retrieval boundary can front vector or hybrid search."
          />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <SecureKnowledgeDemo />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Design choice</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Permissions are not a prompt instruction.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">A prompt that says “do not reveal restricted data” is not an authorization system. The retrieval layer enforces the security boundary in code, before generation. The model is responsible for answering from authorized evidence; it is not responsible for deciding what the user is allowed to know.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/" className="btn-secondary">Back to selected projects</Link><a href="https://github.com/hkaur2001/harpreet_portfolio" target="_blank" rel="noreferrer" className="btn-secondary">Inspect source ↗</a></div>
          </div>
        </div>
      </section>
    </main>
  );
}
