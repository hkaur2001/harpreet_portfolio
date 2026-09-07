import Link from "next/link";
import { ProjectHowItWorks } from "@/components/project-how-it-works";
import { VibeCheckLab } from "@/components/vibecheck-lab";

export const metadata = {
  title: "VibeCheck — Product Strategy Case Study",
  description: "A playful product management case study about helping friend groups make plans faster through discovery, prioritization, metrics, MVP scoping, and experiments.",
};

export default function VibeCheckPage() {
  return (
    <main>
      <section className="grid-field border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--signal)]">Selected project · product management · product sense</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] md:text-7xl">VibeCheck</h1>
          <p className="mt-6 max-w-3xl text-balance text-xl leading-9">Get a group from “I’m down for anything” to an actual plan before the group chat hits message #73.</p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)]">This is a product strategy exercise built to show how I frame a user problem, separate assumptions from evidence, prioritize under capacity constraints, define an MVP, choose meaningful metrics, and design a launch experiment. It is intentionally playful—and intentionally not another AI demo.</p>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Job to be done</p><p className="mt-3 text-sm leading-6">When my friends want to hang out tonight, help us converge on one plan quickly without one person becoming the unpaid coordinator.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product principle</p><p className="mt-3 text-sm leading-6">Optimize for <strong>decision speed with confidence</strong>, not browsing time, feed engagement, or number of options viewed.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Constraint</p><p className="mt-3 text-sm leading-6">The product has to feel lighter than the group chat it is replacing. If it takes ten minutes to configure, it already lost.</p></div>
          </div>

          <ProjectHowItWorks
            steps={[
              { title: "Frame the user job", body: "Start with the coordination outcome: a group needs one plan everyone can live with, quickly." },
              { title: "List assumptions", body: "Treat decision fatigue, hidden constraints, and social pressure as hypotheses to validate—not facts because they sound plausible." },
              { title: "Prioritize the MVP", body: "Use a lightweight RICE model for comparison, then force the real tradeoff with a fixed capacity budget." },
              { title: "Define the metric tree", body: "Use plans confirmed within 10 minutes as the north-star candidate, with invitation, completion, cancellation, and satisfaction guardrails." },
              { title: "Design the experiment", body: "Compare the constrained decision flow against an open-ended planning flow with explicit rollout criteria." },
              { title: "Write down what is cut", body: "Chat, social features, and novelty mechanics stay out unless discovery proves they solve the core job better than the simpler flow." },
            ]}
            toolGroups={[
              { label: "Product strategy", items: ["Problem framing", "Jobs to be Done", "Personas", "Assumption mapping", "MVP scoping", "Roadmapping"] },
              { label: "Decision tools", items: ["RICE prioritization", "Capacity tradeoffs", "PRD thinking", "Non-goals", "Success criteria", "Guardrails"] },
              { label: "Growth + learning", items: ["North-star metrics", "Funnel metrics", "A/B experiment design", "Qualitative feedback", "Launch criteria", "Iteration plan"] },
            ]}
            note="The user-research findings and experiment outcomes are not fabricated here. This page shows the questions, hypotheses, prioritization logic, and validation plan I would use before claiming product-market evidence."
          />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <VibeCheckLab />
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Discovery plan</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Before building, I would try to kill the idea.</h2>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">A convincing product case is not “I had an idea and designed features.” The important work is finding out whether the pain is frequent, important, and poorly served enough to justify a product.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">01</p><h3 className="mt-3 font-semibold">Interview the coordinator</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Ask who usually pushes the group to a decision, what work they do, and when they give up. Look for repeated behavior, not feature requests.</p></article>
              <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">02</p><h3 className="mt-3 font-semibold">Observe the messy moment</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Collect anonymized examples of real planning threads and map where the decision stalls: option generation, constraints, voting, or commitment.</p></article>
              <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">03</p><h3 className="mt-3 font-semibold">Prototype the smallest intervention</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Test a clickable flow that gathers constraints and forces a shortlist before investing in venue integrations, accounts, or social graphs.</p></article>
              <article className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6"><p className="font-mono text-xs text-[var(--signal)]">04</p><h3 className="mt-3 font-semibold">Measure the user outcome</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">If people click more but still take 25 minutes to decide—or cancel after choosing—the product is not solving the job.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-[2rem] bg-[var(--ink)] px-7 py-10 text-white md:px-10 md:py-12">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">What this project is meant to prove</p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
              <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.045em]">I can move between user problems, product decisions, metrics, and implementation—not only write the code after the roadmap exists.</h2>
              <div className="grid gap-3 text-sm leading-6 text-white/70"><p>• Turn an ambiguous consumer pain into a crisp job and target segment.</p><p>• Make scope tradeoffs instead of calling every feature “important.”</p><p>• Define success before launch and separate primary metrics from guardrails.</p><p>• Treat product intuition as a hypothesis that needs evidence.</p><p>• Communicate why a feature is in, why another is out, and what would change the decision.</p></div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/projects" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-85">See all projects →</Link><Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black">Back home</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
