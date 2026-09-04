import { LabPlayground } from "@/components/lab-playground";
import { SectionHeading } from "@/components/section-heading";
import { labs } from "@/lib/site";

export const metadata = { title: "Working AI Labs", description: "Server-executed AI system workflows by Harpreet Kaur." };

export default function LabsPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]"><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><SectionHeading eyebrow="Working AI labs" title="See the system execute, not just the final answer." body="Each lab starts with a real deployment problem, runs through a server-side tool workflow, and exposes the trace, guardrails, evidence, metrics, and engineering skills used. The deterministic mode is intentional: it makes system behavior testable and keeps every demo available without a paid model account." /><div className="mt-10 grid gap-4 md:grid-cols-3">{["1. Pick a scenario", "2. Run the server workflow", "3. Inspect every decision"].map((step, i) => <div key={step} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="font-mono text-[11px] text-[var(--signal)]">0{i + 1}</p><p className="mt-3 font-semibold">{step}</p></div>)}</div></div></section>
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24"><div className="space-y-24">{labs.map((lab, index) => (<section key={lab.slug} id={lab.slug} className="scroll-mt-24"><div className="mb-8 grid gap-6 md:grid-cols-[100px_1fr]"><p className="font-mono text-xs text-[var(--muted)]">0{index + 1}</p><div className="max-w-4xl"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">{lab.kicker}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{lab.title}</h2><p className="mt-4 text-base leading-7 text-[var(--muted)]">{lab.summary}</p><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Problem</p><p className="mt-3 text-sm leading-6">{lab.problem}</p></div><div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Implementation surface</p><div className="mt-3 flex flex-wrap gap-2">{lab.stack.map((s) => <span key={s} className="rounded-full bg-[var(--soft)] px-3 py-1.5 text-xs">{s}</span>)}</div></div></div></div></div><LabPlayground slug={lab.slug} /></section>))}</div></div>
    </main>
  );
}
