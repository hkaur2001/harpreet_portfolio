import Link from "next/link";
import { site } from "@/lib/site";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3 font-semibold tracking-[-0.02em]">
          <span className="grid size-7 place-items-center rounded-full border border-[var(--line)] text-xs">HK</span>
          <span className="hidden sm:inline">{site.name}</span>
        </Link>
        <nav aria-label="Primary navigation" className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm text-[var(--muted)] sm:gap-4">
          <Link className="rounded-full bg-[var(--ink)] px-3.5 py-2 text-xs font-semibold text-[var(--bg)] transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)] sm:px-4 sm:text-sm" href="/projects">Projects</Link>
          <Link className="hidden transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--signal)] md:inline" href="/#experience">Experience</Link>
          <Link className="hidden transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--signal)] lg:inline" href="/#thinking">Thinking</Link>
          <a className="rounded-full border border-[var(--ink)] px-3 py-2 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)] sm:px-4 sm:text-sm" href={`mailto:${site.email}`}>Contact</a>
        </nav>
      </div>
    </header>
  );
}
