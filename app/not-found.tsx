import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto max-w-4xl px-5 py-32 md:px-8"><p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">404</p><h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em]">This route is not in the deployment plan.</h1><p className="mt-5 text-[var(--muted)]">The safe fallback is reversible.</p><Link className="mt-8 inline-block rounded-full border border-[var(--ink)] px-4 py-2 text-sm font-semibold" href="/">Return home →</Link></main>;
}
