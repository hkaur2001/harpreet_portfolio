import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";

export const metadata = {
  title: "AI Policy Radar",
  description: "A live public-data product that tracks recent U.S. federal AI-related regulatory documents.",
};

type Agency = { name?: string };
type FederalDocument = {
  document_number?: string;
  title?: string;
  abstract?: string | null;
  publication_date?: string;
  html_url?: string;
  type?: string;
  agencies?: Agency[];
};
type FederalResponse = { count?: number; results?: FederalDocument[] };

async function getDocuments(): Promise<FederalResponse> {
  const params = new URLSearchParams({ per_page: "12", order: "newest", "conditions[term]": "artificial intelligence" });
  const response = await fetch(`https://www.federalregister.gov/api/v1/documents.json?${params.toString()}`, {
    next: { revalidate: 3600 },
    headers: { "User-Agent": "harpreet-portfolio-policy-radar" },
  });
  if (!response.ok) throw new Error(`Federal Register request failed: ${response.status}`);
  return response.json();
}

function agencyName(doc: FederalDocument) {
  return doc.agencies?.map((agency) => agency.name).filter(Boolean).join(", ") || "Federal agency";
}

export default async function PolicyRadarPage() {
  let data: FederalResponse = {};
  let error = "";
  try {
    data = await getDocuments();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load Federal Register data.";
  }

  const results = data.results ?? [];
  const agencyCounts = results.reduce<Record<string, number>>((acc, doc) => {
    const agency = agencyName(doc);
    acc[agency] = (acc[agency] ?? 0) + 1;
    return acc;
  }, {});
  const topAgencies = Object.entries(agencyCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · live public data</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">AI Policy Radar</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">A focused monitoring product for people who want to know when a new U.S. federal document related to artificial intelligence appears—without repeatedly searching government sites by hand.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Problem</p><p className="mt-3 text-sm leading-6">Relevant federal notices and rules change continuously and are easy to miss when monitored manually.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product</p><p className="mt-3 text-sm leading-6">A live, source-linked feed of recent AI-related Federal Register documents with lightweight agency summaries.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Design choice</p><p className="mt-3 text-sm leading-6">No LLM is required for the core workflow; trustworthy retrieval and provenance matter more than generated prose.</p></div>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Query the Federal Register", body: "A server-side request searches newest-first documents containing the term artificial intelligence." },
              { title: "Cache for one hour", body: "Next.js revalidation reduces unnecessary upstream traffic while keeping the page current." },
              { title: "Normalize the response", body: "Dates, agencies, document type, title, abstract, and primary-source URLs are converted into a stable UI shape." },
              { title: "Build a small activity summary", body: "The current result sample is grouped by agency so the page exposes more than a raw API dump." },
              { title: "Preserve primary-source provenance", body: "Every record links to the original Federal Register page rather than replacing it with generated content." },
              { title: "Handle upstream failure explicitly", body: "If the government API is unavailable, the product shows a degraded state instead of inventing or silently serving fake data." },
            ]}
            toolGroups={[
              { label: "Live in this project", items: ["Next.js", "TypeScript", "Server Components", "Federal Register API", "Caching", "Data normalization"] },
              { label: "Reliability", items: ["Error handling", "Graceful degradation", "Primary-source links", "Stable data contracts"] },
              { label: "Product judgment", items: ["No unnecessary LLM", "Low-cost architecture", "Readable monitoring UI", "Source provenance"] },
            ]}
          />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Live query</p><p className="mt-4 text-2xl font-semibold">artificial intelligence</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Newest-first Federal Register search, refreshed hourly.</p></div>
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Matching records</p><p className="mt-4 text-3xl font-semibold">{data.count?.toLocaleString() ?? "—"}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Total matches reported by the source API.</p></div>
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Current page</p><p className="mt-4 text-3xl font-semibold">{results.length}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Latest source records rendered below.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <aside>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Current sample</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Which agencies appear most often?</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">This is deliberately a small summary over the records currently rendered, not a claim about all federal AI activity.</p>
              {topAgencies.length > 0 && <div className="mt-6 space-y-2">{topAgencies.map(([agency, count]) => <div key={agency} className="flex justify-between gap-4 border-b border-[var(--line)] py-3 text-sm"><span>{agency}</span><span className="font-mono">{count}</span></div>)}</div>}
            </aside>

            <div>
              <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Live records</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Recent federal AI-related documents</h2></div><Link href="/" className="text-sm font-semibold underline underline-offset-4">Back home</Link></div>
              {error ? <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-semibold">The upstream source is unavailable right now.</p><p className="mt-2 text-sm text-[var(--muted)]">{error}</p></div> : <div className="mt-8 space-y-3">{results.map((doc) => <article key={doc.document_number ?? doc.html_url ?? doc.title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><div className="flex flex-wrap gap-2 text-[11px] text-[var(--muted)]"><span>{doc.publication_date ?? "Date unavailable"}</span><span>·</span><span>{doc.type ?? "Document"}</span><span>·</span><span>{agencyName(doc)}</span></div><h3 className="mt-3 text-lg font-semibold leading-7">{doc.title ?? "Untitled document"}</h3>{doc.abstract && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{doc.abstract}</p>}{doc.html_url && <a className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4" href={doc.html_url} target="_blank" rel="noreferrer">Open primary source ↗</a>}</article>)}</div>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
