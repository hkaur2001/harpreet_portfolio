import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-2 md:px-8">
        <div>
          <p className="font-semibold">{site.name}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Software engineer working across full-stack products, applied AI, data integrations, and production systems.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm md:justify-end">
          <a className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)]" href={site.github} target="_blank" rel="noreferrer">GitHub</a>
          <a className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)]" href={site.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)]" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
      </div>
    </footer>
  );
}
