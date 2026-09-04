import Link from "next/link";

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
  const params = new URLSearchParams({
    per_page: "12",
    order: "newest",
    "conditions[term]": "artificial intelligence",
  });
  const response = await fetch(`https://www.federalregister.gov/api/v1/documents.json?${params.toString()}`, {
    next: { revalidate: 3600 },
    headers: { "User-Agent": "harpreet-portfolio-policy-radar" },
  });
  if (!response.ok) throw new Error(`Federal Register request failed: ${response.status}`);
  return response.json();
}

function agencyName(doc: FederalDocument) {
  return doc.agencies?.map((a) => a.name).filter(Boolean).join(", ") || "Federal agency";
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
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Live data product · public API · production deployment</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">AI Policy Radar</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">A small production data product that turns a live government API into a useful monitoring surface for AI-related regulatory activity. No mock data, no paid API, and every item links back to the primary source.</p>
          <div className="mt-8 flex flex-wrap gap-2">{["Next.js server components", "External API integration", "Caching", "Source provenance", "Failure handling", "Live deployment"].map((x) => <span key={x} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs">{x}</span>)}</div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]"><div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Live query</p><p className="mt-4 text-3xl font-semibold">artificial intelligence</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Federal Register newest-first search, refreshed hourly.</p></div><div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">API result count</p><p className="mt-4 text-3xl font-semibold">{data.count?.toLocaleString() ?? "—"}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Total matching public records reported by the source API.</p></div><div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Current sample</p><p className="mt-4 text-3xl font-semibold">{results.length}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Latest records inspected on this page.</p></div></div></div></section>

      <section><div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <aside>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">How the product works</p>
            <ol className="mt-5 space-y-4 text-sm leading-6">{["Query the Federal Register API from the server.", "Cache results for one hour to avoid wasteful repeated calls.", "Normalize agencies, dates, document type, and source links.", "Compute a small agency activity summary from the current result set.", "Render source-linked records and degrade gracefully if the upstream API fails."].map((step, i) => <li key={step} className="flex gap-3"><span className="font-mono text-[var(--signal)]">0{i + 1}</span><span>{step}</span></li>)}</ol>
            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-sm font-semibold">Why this belongs in the portfolio</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">It proves a different engineering surface than the agent labs: live external data, API integration, server rendering, caching, provenance, and production failure handling.</p></div>
            {topAgencies.length > 0 && <div className="mt-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Most represented agencies in current sample</p><div className="mt-3 space-y-2">{topAgencies.map(([agency, count]) => <div key={agency} className="flex justify-between gap-4 border-b border-[var(--line)] py-2 text-sm"><span>{agency}</span><span className="font-mono">{count}</span></div>)}</div></div>}
          </aside>

          <div>
            <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Live records</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Recent federal AI-related documents</h2></div><Link href="/" className="text-sm font-semibold underline underline-offset-4">Back home</Link></div>
            {error ? <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-semibold">The upstream source is unavailable right now.</p><p className="mt-2 text-sm text-[var(--muted)]">{error}</p></div> : <div className="mt-8 space-y-3">{results.map((doc) => <article key={doc.document_number ?? doc.html_url ?? doc.title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><div className="flex flex-wrap gap-2 text-[11px] text-[var(--muted)]"><span>{doc.publication_date ?? "Date unavailable"}</span><span>·</span><span>{doc.type ?? "Document"}</span><span>·</span><span>{agencyName(doc)}</span></div><h3 className="mt-3 text-lg font-semibold leading-7">{doc.title ?? "Untitled document"}</h3>{doc.abstract && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{doc.abstract}</p>}{doc.html_url && <a className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4" href={doc.html_url} target="_blank" rel="noreferrer">Open primary source ↗</a>}</article>)}</div>}
          </div>
        </div>
      </div></section>
    </main>
  );
}
