import Link from "next/link";
import { EnoughCreate } from "@/components/enough-create";

export const metadata = {
  title: "Enough — Plans that unlock when enough people are in",
  description: "Throw out a casual plan, set the minimum number of people that makes it worth doing, and let the plan unlock automatically only when enough friends privately commit.",
};

export default function EnoughPage() {
  return (
    <main className="min-h-screen bg-[#f6f0e8] text-[#1e1b18]">
      <header className="border-b border-[#2a2723]/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/enough" className="text-xl font-black tracking-[-0.04em]">enough<span className="text-[#7856ff]">.</span></Link>
          <div className="flex items-center gap-3 text-sm"><span className="hidden text-[#756f68] sm:inline">plans that earn their way onto the calendar</span><Link href="/projects/enough" className="rounded-full border border-[#2a2723]/15 bg-white px-4 py-2 font-semibold">How it was built ↗</Link></div>
        </div>
      </header>

      <section className="overflow-hidden border-b border-[#2a2723]/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eee8ff] px-3 py-2 text-xs font-bold text-[#4a387f]"><span className="size-2 rounded-full bg-[#7856ff]" /> Blind quorum planning</div>
            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-black tracking-[-0.065em] sm:text-6xl lg:text-7xl">Say “I’m in” without being the first person to say it.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#625b55]">Throw out an idea for tonight, tomorrow, or the weekend. Pick how many people would make it worth doing. Friends commit privately. If the number is reached, the plan unlocks automatically and the guest list appears.</p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[['1','Throw it out','An idea, not a formal event.'],['2','Commit privately','Only the total count is visible.'],['3','Unlock together','Enough yeses → it becomes real.']].map(([n,title,body]) => <div key={n} className="rounded-2xl border border-[#2a2723]/10 bg-[#fffdf9] p-4"><p className="text-xs font-black text-[#7856ff]">0{n}</p><p className="mt-2 font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[#756f68]">{body}</p></div>)}
            </div>
          </div>

          <div className="relative min-h-[390px] rounded-[2.5rem] bg-[#1e1b18] p-6 text-[#fffaf3] shadow-[0_30px_100px_rgba(38,31,24,0.18)] md:p-8">
            <div className="absolute right-8 top-8 rounded-full bg-[#c6f6dc] px-3 py-1.5 text-xs font-black text-[#1e1b18]">3 / 4</div>
            <div className="grid size-16 place-items-center rounded-2xl bg-[#ffdfd4] text-4xl">🍜</div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#cfc1ff]">1 more person and it unlocks</p>
            <h2 className="mt-3 max-w-sm text-4xl font-black tracking-[-0.05em]">Ramen + a walk tomorrow?</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">East Village · 7:30 PM<br />No names shown yet.</p>
            <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-[#7856ff]" /></div>
            <div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#ff8f70] px-4 py-4 text-center text-sm font-black text-[#1e1b18]">I’m in if it happens</div><div className="rounded-2xl border border-white/15 px-4 py-4 text-center text-sm font-bold">Not this one</div></div>
            <p className="mt-5 text-center text-xs text-white/40">Your response stays private until the plan unlocks.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#7856ff]">Create one now</p><h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">Give your friends something easy to say yes to.</h2></div><p className="max-w-md text-sm leading-6 text-[#756f68]">Enough is intentionally link-first: no social feed, no popularity score, no endless setup before you can test an idea.</p></div>
        <EnoughCreate />
      </section>

      <section className="border-t border-[#2a2723]/10 bg-[#fffdf9]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3 md:px-8 md:py-20">
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#7856ff]">Why blind?</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">Reduce the “who else is going?” tax.</h3><p className="mt-3 text-sm leading-6 text-[#756f68]">Before confirmation, commitment should answer one question: would you personally go if enough people joined? Hiding identities keeps early responders from setting the social tone.</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#7856ff]">Why reveal later?</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">Once it’s real, the guest list becomes useful.</h3><p className="mt-3 text-sm leading-6 text-[#756f68]">After quorum, the social-pressure problem changes. Now you need logistics: who’s actually coming, where to meet, and how to put it on the calendar.</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#7856ff]">Why no AI?</p><h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">The core job is commitment, not content generation.</h3><p className="mt-3 text-sm leading-6 text-[#756f68]">This product deliberately uses deterministic rules for threshold activation. AI can help with recommendations later, but it should not complicate the one thing the product has to get right.</p></div>
        </div>
      </section>
    </main>
  );
}
