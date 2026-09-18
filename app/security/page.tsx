import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security & Data Handling",
  description: "Security controls, data handling, threat boundaries, and responsible disclosure for Harpreet Kaur's engineering portfolio.",
};

const projectControls = [
  ["Atlas", "Synthetic scenarios and request-scoped workflow brief; no persistence or external writes", "Live model-selected tools; allowlists, argument validation, budgets, evidence validation, and human review", "No customer systems, credentials, or production connectors; the model provider processes submitted text"],
  ["FieldGuide", "Public scenarios or user-entered workflow text; request-scoped", "Per-action authorization, golden-set gates, prompt-injection tests, bounded fallback", "Reference VPC/on-prem patterns are not represented as live infrastructure"],
  ["Sentinel", "Synthetic incident telemetry only", "Allowlisted tools, deterministic policy, human approval, evidence IDs, no arbitrary shell or SQL", "Every remediation is simulated; no production credentials exist"],
  ["Secure Knowledge", "Small synthetic corpus and demo personas", "Identity and ACL filter execute before retrieval; denied documents never reach generation", "Production SSO, tenant isolation, and external policy stores are reference architecture"],
  ["Voiceprint", "Pasted samples are processed for one request and not persisted by the server", "Length limits, exact-copy detection, provider fallback, browser-local retrieval", "The browser downloads a version-pinned Transformers.js module and model assets from public CDNs"],
  ["SignalBrief", "Goal and topic text are request-scoped", "Public-source search, citation coverage, explicit source-gap fallback, no authenticated scraping", "Fresh claims are withheld when live research is unavailable"],
  ["Policy Radar", "Public Federal Register data only", "Primary-source links, normalization, caching, visible upstream failure", "No model inference and no user data"],
  ["Enough", "Names, optional email, RSVP choices, and plan details", "Blind-quorum privacy, hashed capability tokens, row-level-security design, atomic confirmation", "Public demo tokens are browser-held capabilities; do not use for sensitive events"],
] as const;

export default function SecurityPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Security & data handling</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">Make the trust boundary visible.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">This portfolio is a public demonstration environment. It uses synthetic data where a realistic production system would require customer or operational information, keeps provider credentials server-side, bounds every public input, and labels simulated or reference components explicitly.</p>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Secrets", "Provider keys remain server-only environment variables. Health endpoints expose booleans and public model IDs—not values."],
              ["Public APIs", "JSON content-type enforcement, per-route body-size limits, bounded schemas, timeouts, and best-effort per-IP rate limits."],
              ["Browser", "CSP, anti-framing, MIME sniffing protection, restricted permissions, strict referrer policy, and HTTPS transport policy."],
              ["AI authority", "Model output is untrusted. Identity, authorization, release gates, approval, and consequential actions stay in deterministic code."],
            ].map(([title, body]) => <article key={title} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-4 text-sm leading-7 text-[var(--muted)]">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Project-by-project threat boundaries</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">Controls follow the consequence.</h2>
          <div className="mt-10 overflow-x-auto rounded-3xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.1em] text-[var(--muted)]"><th className="p-5">Project</th><th className="p-5">Data boundary</th><th className="p-5">Implemented controls</th><th className="p-5">Explicit limitation</th></tr></thead>
              <tbody>{projectControls.map(([project, data, controls, limitation]) => <tr key={project} className="border-b border-[var(--line)] last:border-0 align-top"><th className="p-5 font-semibold">{project}</th><td className="p-5 leading-6 text-[var(--muted)]">{data}</td><td className="p-5 leading-6 text-[var(--muted)]">{controls}</td><td className="p-5 leading-6 text-[var(--muted)]">{limitation}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7"><h3 className="text-2xl font-semibold">Data retention</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]">Atlas, FieldGuide, Sentinel, Secure Knowledge, Voiceprint, SignalBrief, and Policy Radar do not intentionally persist user-entered demo content. Enough can persist plan and RSVP state when its database is configured; its product page and API health response identify the active mode.</p></article>
            <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7"><h3 className="text-2xl font-semibold">Responsible disclosure</h3><p className="mt-4 text-sm leading-7 text-[var(--muted)]">If you discover a security issue, avoid testing against real people or sensitive data. Send a minimal reproduction privately by email. Do not include credentials or personal data in a public issue.</p><a className="btn-primary mt-6 rounded-full px-5" href="mailto:harpreetkaur622@gmail.com?subject=Private%20security%20report">Report privately →</a></article>
          </div>
          <div className="mt-8"><Link href="/projects" className="btn-secondary">Review project architecture →</Link></div>
        </div>
      </section>
    </main>
  );
}
