import Link from "next/link";
import { site } from "@/lib/site";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-[-0.02em]">
          <span className="grid size-7 place-items-center rounded-full border border-[var(--line)] text-xs">HK</span>
          <span className="hidden sm:inline">{site.name}</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-[var(--muted)] sm:gap-4">
          <Link className="rounded-full border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-[var(--bg)] transition hover:opacity-80 sm:text-sm" href="/projects/fieldguide">FieldGuide</Link>
          <Link className="transition hover:text-[var(--ink)]" href="/projects">Projects</Link>
          <Link className="hidden transition hover:text-[var(--ink)] md:inline" href="/#experience">Experience</Link>
          <Link className="hidden transition hover:text-[var(--ink)] lg:inline" href="/#thinking">Thinking</Link>
          <a className="rounded-full border border-[var(--ink)] px-3 py-2 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--bg)] sm:px-4 sm:text-sm" href={`mailto:${site.email}`}>Contact</a>
        </nav>
      </div>
    </header>
  );
}
