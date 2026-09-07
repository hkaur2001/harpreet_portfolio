"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type PlanView = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  location: string;
  startsAt: string;
  deadlineAt: string;
  threshold: number;
  status: "open" | "confirmed" | "expired" | "cancelled";
  yesCount: number;
  remaining: number;
  hostName: string;
  hostPledged: boolean | null;
  guestList: Array<{ name: string; isHost: boolean }> | null;
  viewerResponse: "yes" | "no" | null;
  createdAt: string;
};

type DemoPlan = PlanView & { responses: Array<{ token: string; name: string; email: string; response: "yes" | "no"; isHost: boolean }> };

type Health = { persistentStoreConfigured?: boolean; emailNotificationsConfigured?: boolean };

function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function timeLeft(value: string) {
  const ms = new Date(value).getTime() - Date.now();
  if (ms <= 0) return "closed";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

function mapUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function googleCalendarUrl(plan: PlanView) {
  const date = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const start = new Date(plan.startsAt);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({ action: "TEMPLATE", text: `${plan.emoji} ${plan.title}`, dates: `${date(start)}/${date(end)}`, details: plan.description, location: plan.location });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function demoToView(demo: DemoPlan, participantToken: string): PlanView {
  let status = demo.status;
  if (status === "open" && new Date(demo.deadlineAt).getTime() <= Date.now()) status = "expired";
  const yes = demo.responses.filter((r) => r.response === "yes");
  if (status === "open" && yes.length >= demo.threshold) status = "confirmed";
  const viewer = demo.responses.find((r) => r.token === participantToken);
  return {
    ...demo,
    status,
    yesCount: yes.length,
    remaining: Math.max(0, demo.threshold - yes.length),
    hostPledged: status === "confirmed" ? demo.hostPledged : null,
    guestList: status === "confirmed" ? yes.map((r) => ({ name: r.name, isHost: r.isHost })) : null,
    viewerResponse: viewer?.response ?? null,
  };
}

export function EnoughPlanClient({ slug }: { slug: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [plan, setPlan] = useState<PlanView | null>(null);
  const [participantToken, setParticipantToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const key = `enough:participant:${slug}`;
    let existing = localStorage.getItem(key);
    if (!existing) { existing = token(); localStorage.setItem(key, existing); }
    setParticipantToken(existing);
    const savedName = localStorage.getItem("enough:displayName");
    const savedEmail = localStorage.getItem("enough:email");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, [slug]);

  const load = useCallback(async () => {
    if (!participantToken) return;
    const healthResponse = await fetch("/api/enough/health", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ persistentStoreConfigured: false }));
    setHealth(healthResponse);
    if (healthResponse.persistentStoreConfigured && !slug.startsWith("demo-")) {
      const response = await fetch(`/api/enough/plans/${encodeURIComponent(slug)}?participantToken=${encodeURIComponent(participantToken)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load this plan.");
      setPlan(body);
      return;
    }
    const raw = localStorage.getItem(`enough:demo:${slug}`);
    if (!raw) throw new Error("This demo plan only exists in the browser where it was created. Connect Supabase to make share links work across devices.");
    const demo = JSON.parse(raw) as DemoPlan;
    const view = demoToView(demo, participantToken);
    demo.status = view.status;
    localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo));
    setPlan(view);
  }, [participantToken, slug]);

  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load plan.")); }, [load]);
  useEffect(() => {
    const interval = window.setInterval(() => { tick((x) => x + 1); if (health?.persistentStoreConfigured) load().catch(() => undefined); }, 3500);
    return () => window.clearInterval(interval);
  }, [health?.persistentStoreConfigured, load]);

  async function respond(responseValue: "yes" | "no") {
    if (!plan || !participantToken || !name.trim()) { setError("Add your name first."); return; }
    setBusy(true); setError("");
    localStorage.setItem("enough:displayName", name.trim());
    if (email.trim()) localStorage.setItem("enough:email", email.trim());
    try {
      if (health?.persistentStoreConfigured && !slug.startsWith("demo-")) {
        const response = await fetch(`/api/enough/plans/${encodeURIComponent(slug)}/rsvp`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), response: responseValue, participantToken }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to save your RSVP.");
        setPlan(body.view);
      } else {
        const raw = localStorage.getItem(`enough:demo:${slug}`);
        if (!raw) throw new Error("Demo plan not found.");
        const demo = JSON.parse(raw) as DemoPlan;
        const existing = demo.responses.find((r) => r.token === participantToken);
        if (existing) { existing.response = responseValue; existing.name = name.trim(); existing.email = email.trim(); }
        else demo.responses.push({ token: participantToken, name: name.trim(), email: email.trim(), response: responseValue, isHost: false });
        const next = demoToView(demo, participantToken);
        demo.status = next.status;
        localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo));
        setPlan(next);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save your RSVP."); }
    finally { setBusy(false); }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: plan?.title || "Enough", text: plan ? `${plan.emoji} ${plan.title} — it only happens if ${plan.threshold} people are in.` : "Join this plan on Enough.", url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  async function cancel() {
    if (!plan || !confirm("Cancel this plan for everyone?")) return;
    const secret = localStorage.getItem(`enough:host:${slug}`) || "";
    if (!secret) { setError("Host controls are only available on the device that created the plan."); return; }
    if (!health?.persistentStoreConfigured || slug.startsWith("demo-")) {
      const raw = localStorage.getItem(`enough:demo:${slug}`);
      if (raw) { const demo = JSON.parse(raw) as DemoPlan; demo.status = "cancelled"; localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo)); setPlan(demoToView(demo, participantToken)); }
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/enough/plans/${encodeURIComponent(slug)}/host`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", hostSecret: secret }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to cancel plan.");
      setPlan(body.view);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to cancel plan."); }
    finally { setBusy(false); }
  }

  const isHost = useMemo(() => typeof window !== "undefined" && Boolean(localStorage.getItem(`enough:host:${slug}`)), [slug, plan]);

  if (!plan && !error) return <div className="grid min-h-[70vh] place-items-center bg-[#f6f0e8]"><div className="text-center text-[#1e1b18]"><div className="mx-auto size-9 animate-spin rounded-full border-2 border-[#1e1b18]/15 border-t-[#7856ff]" /><p className="mt-4 text-sm">Loading the plan…</p></div></div>;
  if (!plan) return <div className="mx-auto max-w-2xl px-5 py-24"><div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900"><h1 className="text-2xl font-semibold">This plan is not available.</h1><p className="mt-3 text-sm leading-6">{error}</p><Link href="/enough" className="mt-5 inline-flex font-semibold underline">Create a new plan</Link></div></div>;

  const pct = Math.min(100, Math.round(plan.yesCount / plan.threshold * 100));
  const open = plan.status === "open";
  const confirmed = plan.status === "confirmed";
  const closed = plan.status === "expired" || plan.status === "cancelled";

  return (
    <main className="min-h-screen bg-[#f6f0e8] text-[#1e1b18]">
      <header className="border-b border-[#2a2723]/10"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><Link href="/enough" className="text-xl font-black tracking-[-0.04em]">enough<span className="text-[#7856ff]">.</span></Link><div className="flex items-center gap-2"><button onClick={share} className="rounded-full border border-[#2a2723]/15 bg-white px-4 py-2 text-sm font-semibold">{copied ? "Copied ✓" : "Share ↗"}</button>{isHost && <button onClick={cancel} disabled={busy || closed} className="rounded-full px-3 py-2 text-xs font-semibold text-[#7b7168] underline disabled:opacity-40">Cancel plan</button>}</div></div></header>

      <div className="mx-auto max-w-5xl px-5 py-10 md:py-16">
        {!health?.persistentStoreConfigured && <div className="mb-5 rounded-2xl border border-[#7856ff]/25 bg-[#eee8ff] px-4 py-3 text-xs leading-5 text-[#4a387f]">You are viewing the single-browser demo. The exact same UI switches to shared multi-device mode when the Supabase backend is connected.</div>}
        <section className={`overflow-hidden rounded-[2.25rem] border border-[#2a2723]/10 ${confirmed ? "bg-[#1e1b18] text-[#fffaf3]" : "bg-[#fffdf9]"} shadow-[0_32px_90px_rgba(38,31,24,0.09)]`}>
          <div className="p-7 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-14 place-items-center rounded-2xl bg-[#ffdfd4] text-3xl">{plan.emoji}</span><div><p className={`text-xs font-bold uppercase tracking-[0.15em] ${confirmed ? "text-[#cfc1ff]" : "text-[#7856ff]"}`}>{confirmed ? "Unlocked · it's on" : open ? "Blind quorum · names hidden" : plan.status}</p><p className={`mt-1 text-sm ${confirmed ? "text-white/55" : "text-[#756f68]"}`}>Proposed by {plan.hostName}</p></div></div><span className={`rounded-full px-4 py-2 text-sm font-bold ${confirmed ? "bg-[#c6f6dc] text-[#1e1b18]" : open ? "bg-[#eee8ff] text-[#4a387f]" : "bg-[#ece7e0] text-[#6f665e]"}`}>{confirmed ? "PLAN UNLOCKED" : open ? `${timeLeft(plan.deadlineAt)} left` : plan.status.toUpperCase()}</span></div>

            <h1 className="mt-8 max-w-3xl text-balance text-4xl font-black tracking-[-0.055em] md:text-6xl">{plan.title}</h1>
            {plan.description && <p className={`mt-5 max-w-2xl text-base leading-7 ${confirmed ? "text-white/65" : "text-[#625b55]"}`}>{plan.description}</p>}
            <div className="mt-7 flex flex-wrap gap-2 text-sm font-semibold"><span className={`rounded-full px-4 py-2 ${confirmed ? "bg-white/10" : "bg-[#f4eee6]"}`}>🗓 {formatDate(plan.startsAt)}</span>{plan.location && <a href={mapUrl(plan.location)} target="_blank" rel="noreferrer" className={`rounded-full px-4 py-2 underline-offset-4 hover:underline ${confirmed ? "bg-white/10" : "bg-[#f4eee6]"}`}>📍 {plan.location}</a>}</div>

            <div className="mt-10 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div><div className="flex items-end justify-between gap-3"><div><p className={`text-xs font-bold uppercase tracking-[0.14em] ${confirmed ? "text-white/45" : "text-[#756f68]"}`}>Progress to unlock</p><p className="mt-2 text-3xl font-black">{plan.yesCount} / {plan.threshold}</p></div><p className={`text-sm ${confirmed ? "text-[#c6f6dc]" : "text-[#625b55]"}`}>{confirmed ? "Enough people are in." : `${plan.remaining} more ${plan.remaining === 1 ? "person" : "people"} needed`}</p></div><div className={`mt-4 h-4 overflow-hidden rounded-full ${confirmed ? "bg-white/10" : "bg-[#e8e1d8]"}`}><div className={`h-full rounded-full transition-all duration-700 ${confirmed ? "bg-[#c6f6dc]" : "bg-[#7856ff]"}`} style={{ width: `${pct}%` }} /></div></div>
              <div className={`rounded-2xl px-4 py-3 text-center text-xs leading-5 ${confirmed ? "bg-white/8 text-white/55" : "bg-[#f4eee6] text-[#6f665e]"}`}>{confirmed ? "Guest list revealed" : "No names until it unlocks"}</div>
            </div>
          </div>

          {open && <div className="border-t border-[#2a2723]/10 bg-white p-6 md:p-8"><div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7856ff]">Your private commitment</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">Would you actually go if this unlocks?</h2><p className="mt-2 text-sm leading-6 text-[#756f68]">Your name and response stay hidden from the group until the threshold is reached. Before then, everyone only sees the count.</p></div><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Your name" className="rounded-2xl border border-[#2a2723]/10 bg-[#faf7f2] px-4 py-3.5 outline-none focus:border-[#7856ff]" /><input aria-label="Email for unlock notification" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} placeholder="Email for unlock (optional)" className="rounded-2xl border border-[#2a2723]/10 bg-[#faf7f2] px-4 py-3.5 outline-none focus:border-[#7856ff]" /><button disabled={busy} onClick={() => respond("yes")} className={`rounded-2xl px-5 py-4 text-sm font-black transition disabled:opacity-50 ${plan.viewerResponse === "yes" ? "bg-[#c6f6dc] text-[#1e1b18] ring-2 ring-[#1e1b18]" : "bg-[#1e1b18] text-white hover:-translate-y-0.5"}`}>{plan.viewerResponse === "yes" ? "✓ You're in if it happens" : "I'm in if it happens"}</button><button disabled={busy} onClick={() => respond("no")} className={`rounded-2xl border px-5 py-4 text-sm font-bold disabled:opacity-50 ${plan.viewerResponse === "no" ? "border-[#ff8f70] bg-[#fff0eb]" : "border-[#2a2723]/15 bg-white"}`}>{plan.viewerResponse === "no" ? "✓ Not this one" : "Not this one"}</button></div></div>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}{email && health?.persistentStoreConfigured && !health.emailNotificationsConfigured && <p className="mt-3 text-xs text-[#756f68]">Email notifications are not connected yet; the plan still updates live while the page is open.</p>}</div>}

          {confirmed && <div className="border-t border-white/10 p-7 md:p-10"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c6f6dc]">The reveal</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Enough people said yes. Now you can see who.</h2><div className="mt-6 flex flex-wrap gap-2">{plan.guestList?.map((guest, index) => <span key={`${guest.name}-${index}`} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">{guest.isHost ? "★ " : ""}{guest.name}</span>)}</div></div><div className="rounded-3xl bg-white p-6 text-[#1e1b18]"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7856ff]">Do the actual thing</p><p className="mt-3 text-lg font-semibold">No more “wait, is this still happening?”</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><a href={googleCalendarUrl(plan)} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#1e1b18] px-4 py-3 text-center text-sm font-bold text-white">Add to Google Calendar ↗</a><a href={`/api/enough/plans/${plan.slug}/calendar`} className="rounded-2xl border border-[#2a2723]/15 px-4 py-3 text-center text-sm font-bold">Download .ics</a></div></div></div></div>}

          {plan.status === "expired" && <div className="border-t border-[#2a2723]/10 bg-[#fff8f5] p-7"><h2 className="text-2xl font-bold">Didn't unlock this time.</h2><p className="mt-2 text-sm text-[#756f68]">No awkward cancellation required—the deadline passed before the group reached {plan.threshold} yeses.</p></div>}
          {plan.status === "cancelled" && <div className="border-t border-[#2a2723]/10 bg-[#fff8f5] p-7"><h2 className="text-2xl font-bold">This plan was cancelled.</h2><p className="mt-2 text-sm text-[#756f68]">The host closed this one. Nothing else you need to do.</p></div>}
        </section>

        <div className="mt-7 flex items-center justify-between gap-4 text-xs text-[#756f68]"><p>Private by link · blind before quorum · no public feed</p><Link href="/enough" className="font-bold text-[#1e1b18] underline underline-offset-4">Throw out another plan</Link></div>
      </div>
    </main>
  );
}
