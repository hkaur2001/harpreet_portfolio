import { LabPlayground } from "@/components/lab-playground";
import { SectionHeading } from "@/components/section-heading";
import { labs } from "@/lib/site";

export const metadata = { title: "Agent Labs", description: "Interactive, subscription-free AI agent demos by Harpreet Kaur." };

export default function LabsPage() {
  return (
    <main>
      <section className="border-b border-[var(--line)]"><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><SectionHeading eyebrow="Agent labs" title="Working demos that make the architecture inspectable." body="These demos use synthetic data and deterministic execution by default, so recruiters can explore tool traces, guardrails, evidence, and evaluation signals without creating an account or paying for an API." /></div></section>
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24"><div className="space-y-24">{labs.map((lab, index) => (<section key={lab.slug} id={lab.slug} className="scroll-mt-24"><div className="mb-8 grid gap-6 md:grid-cols-[100px_1fr]"><p className="font-mono text-xs text-[var(--muted)]">0{index + 1}</p><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">{lab.kicker}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{lab.title}</h2><p className="mt-4 text-base leading-7 text-[var(--muted)]">{lab.summary}</p><div className="mt-5 flex flex-wrap gap-2">{lab.signals.map((s) => <span key={s} className="rounded-full bg-[var(--soft)] px-3 py-1.5 text-xs">{s}</span>)}</div></div></div><LabPlayground slug={lab.slug} /></section>))}</div></div>
    </main>
  );
}
