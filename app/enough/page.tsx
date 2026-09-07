import Link from "next/link";
import { EnoughCreate } from "@/components/enough-create";

export const metadata = {
  title: "Enough — Find a plan your group can actually make",
  description: "Enough finds a compatible quorum across time and place, confirms the plan automatically, and becomes the group's day-of coordination hub.",
};

export default function EnoughPage() {
  return (
    <main className="min-h-screen bg-[#f6f0e8] text-[#1e1b18]">
      <header className="border-b border-[#2a2723]/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/enough" className="text-xl font-black tracking-[-0.04em]">enough<span className="text-[#7856ff]">.</span></Link>
          <div className="flex items-center gap-3 text-sm"><span className="hidden text-[#756f68] sm:inline">from “maybe” to an executable plan</span><Link href="/projects/enough" className="rounded-full border border-[#2a2723]/15 bg-white px-4 py-2 font-semibold">Product case study ↗</Link></div>
        </div>
      </header>

      <section className="overflow-hidden border-b border-[#2a2723]/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eee8ff] px-3 py-2 text-xs font-bold text-[#4a387f]"><span className="size-2 rounded-full bg-[#7856ff]" /> Compatible quorum planning</div>
            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-black tracking-[-0.065em] sm:text-6xl lg:text-7xl">Don’t vote on a plan. Find one enough people can actually make.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#625b55]">Throw out the idea. Give a few possible times and places. Friends privately mark every version they would genuinely show up for. Enough locks in the first combination that clears your minimum group size—then turns into the single day-of plan card.</p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[["1","Offer a small envelope","A few times + places, not 27 messages."],["2","Collect private fit","Everyone marks what they can really do."],["3","Lock one executable plan","Quorum + overlap → exact plan + guest list."]].map(([n,title,body]) => <div key={n} className="rounded-2xl border border-[#2a2723]/10 bg-[#fffdf9] p-4"><p className="text-xs font-black text-[#7856ff]">0{n}</p><p className="mt-2 font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[#756f68]">{body}</p></div>)}
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-[#1e1b18] p-6 text-[#fffaf3] shadow-[0_30px_100px_rgba(38,31,24,0.18)] md:p-8">
            <div className="flex items-start justify-between gap-4"><div className="grid size-16 place-items-center rounded-2xl bg-[#ffdfd4] text-4xl">🍜</div><span className="rounded-full bg-[#c6f6dc] px-3 py-1.5 text-xs font-black text-[#1e1b18]">BEST FIT 3 / 4</span></div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#cfc1ff]">5 interested · 3 currently overlap</p>
            <h2 className="mt-3 max-w-sm text-4xl font-black tracking-[-0.05em]">Dinner + a walk?</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2"><div className="rounded-2xl bg-white/8 p-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Times I can do</p><p className="mt-2 text-sm font-semibold">✓ Fri 7:00 · ✓ Fri 8:30</p></div><div className="rounded-2xl bg-white/8 p-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Places I’d go</p><p className="mt-2 text-sm font-semibold">✓ East Village · LES</p></div></div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-[#7856ff]" /></div>
            <p className="mt-5 text-xs leading-5 text-white/45">Enough does not count “yes” unless those yeses share a viable version. Nobody sees who chose what before confirmation.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#2a2723]/10 bg-[#fffdf9]">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-10 md:grid-cols-3 md:px-8">
          <div className="rounded-3xl bg-[#f6f0e8] p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#7856ff]">Pain #1 · schedules</p><h3 className="mt-2 text-xl font-black tracking-[-0.03em]">“We all said yes, but not to the same time.”</h3><p className="mt-2 text-sm leading-6 text-[#756f68]">Enough finds overlap instead of winning a poll by plurality.</p></div>
          <div className="rounded-3xl bg-[#f6f0e8] p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#7856ff]">Pain #2 · ownership</p><h3 className="mt-2 text-xl font-black tracking-[-0.03em]">“Wait—who was booking the table?”</h3><p className="mt-2 text-sm leading-6 text-[#756f68]">One explicit post-unlock owner task prevents diffusion of responsibility.</p></div>
          <div className="rounded-3xl bg-[#f6f0e8] p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#7856ff]">Pain #3 · day-of chaos</p><h3 className="mt-2 text-xl font-black tracking-[-0.03em]">“Where is everyone?”</h3><p className="mt-2 text-sm leading-6 text-[#756f68]">The confirmed plan becomes a shared map/calendar/status card with one-tap arrival updates.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#7856ff]">Create one now</p><h2 className="mt-2 max-w-3xl text-4xl font-black tracking-[-0.05em]">Give the group enough flexibility to find a fit—without opening another scheduling spreadsheet.</h2></div></div>
        <EnoughCreate />
      </section>

      <section className="border-t border-[#2a2723]/10 bg-[#fffdf9]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3 md:px-8 md:py-20">
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#7856ff]">Before lock</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">Private constraints, public progress.</h3><p className="mt-3 text-sm leading-6 text-[#756f68]">People can be honest about what they can make without early responders or “who else is going?” shaping the decision.</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#7856ff]">At lock</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">One exact plan, automatically.</h3><p className="mt-3 text-sm leading-6 text-[#756f68]">The database chooses the first time/place combination that has enough compatible people and confirms it once.</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#7856ff]">After lock</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">A tiny coordination operating system.</h3><p className="mt-3 text-sm leading-6 text-[#756f68]">Guest list, directions, calendar, explicit task ownership, and live arrival status stay attached to the plan.</p></div>
        </div>
      </section>
    </main>
  );
}
