"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { responseFitsWinningPlan, solveEnoughFit, type EnoughPlaceOption, type EnoughTimeOption } from "@/lib/enough/match";

type DayOfStatus = "on_my_way" | "on_time" | "10_late" | "20_late" | "cant_make_it";

type PlanView = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  startsAt: string;
  location: string;
  deadlineAt: string;
  durationMinutes: number;
  threshold: number;
  status: "open" | "confirmed" | "expired" | "cancelled";
  yesCount: number;
  bestFitCount: number;
  interestedCount: number;
  remaining: number;
  hostName: string;
  hostPledged: boolean | null;
  hostTask: string;
  hostTaskDone: boolean;
  timeOptions: EnoughTimeOption[];
  placeOptions: EnoughPlaceOption[];
  winningTimeId: string | null;
  winningPlaceId: string | null;
  guestList: Array<{ name: string; isHost: boolean; dayOfStatus: DayOfStatus | null }> | null;
  viewerResponse: "yes" | "no" | null;
  viewerFit: { timeOptionIds: string[]; placeOptionIds: string[] } | null;
  viewerDayOfStatus: DayOfStatus | null;
  viewerIsConfirmedGuest: boolean;
  createdAt: string;
  confirmedAt: string | null;
};

type DemoResponse = {
  token: string;
  name: string;
  email: string;
  response: "yes" | "no";
  isHost: boolean;
  timeOptionIds: string[];
  placeOptionIds: string[];
  dayOfStatus: DayOfStatus | null;
};

type DemoPlan = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  deadlineAt: string;
  durationMinutes: number;
  threshold: number;
  status: PlanView["status"];
  hostName: string;
  hostPledged: boolean;
  hostTask: string;
  hostTaskDone: boolean;
  timeOptions: EnoughTimeOption[];
  placeOptions: EnoughPlaceOption[];
  winningTimeId: string | null;
  winningPlaceId: string | null;
  createdAt: string;
  confirmedAt: string | null;
  responses: DemoResponse[];
};

type Health = { persistentStoreConfigured?: boolean; emailNotificationsConfigured?: boolean; productVersion?: string };

const pulseLabels: Array<[DayOfStatus, string]> = [
  ["on_my_way", "🚶 On my way"],
  ["on_time", "✅ On time"],
  ["10_late", "⏱ 10 min late"],
  ["20_late", "🫠 20+ late"],
  ["cant_make_it", "✕ Can’t make it"],
];

function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function shortTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
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
  const end = new Date(start.getTime() + plan.durationMinutes * 60_000);
  const params = new URLSearchParams({ action: "TEMPLATE", text: `${plan.emoji} ${plan.title}`, dates: `${date(start)}/${date(end)}`, details: plan.description, location: plan.location });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function demoToView(demo: DemoPlan, participantToken: string): PlanView {
  let status = demo.status;
  if (status === "open" && new Date(demo.deadlineAt).getTime() <= Date.now()) status = "expired";
  const fitResponses = demo.responses.map((item) => ({ response: item.response, timeOptionIds: item.timeOptionIds, placeOptionIds: item.placeOptionIds }));
  const fit = solveEnoughFit(demo.timeOptions, demo.placeOptions, fitResponses);
  if (status === "open" && fit.bestFitCount >= demo.threshold) {
    status = "confirmed";
    demo.winningTimeId = fit.winningTimeId;
    demo.winningPlaceId = fit.winningPlaceId;
    demo.confirmedAt = new Date().toISOString();
  }
  const winningTimeId = status === "confirmed" ? demo.winningTimeId : null;
  const winningPlaceId = status === "confirmed" ? demo.winningPlaceId : null;
  const winningTime = demo.timeOptions.find((item) => item.id === winningTimeId) ?? demo.timeOptions[0];
  const winningPlace = demo.placeOptions.find((item) => item.id === winningPlaceId) ?? demo.placeOptions[0];
  const viewer = demo.responses.find((item) => item.token === participantToken);
  const confirmedGuests = status === "confirmed" ? demo.responses.filter((item) => responseFitsWinningPlan(item, winningTimeId, winningPlaceId)) : [];
  const viewerIsConfirmedGuest = Boolean(viewer && status === "confirmed" && responseFitsWinningPlan(viewer, winningTimeId, winningPlaceId));

  return {
    slug: demo.slug,
    title: demo.title,
    emoji: demo.emoji,
    description: demo.description,
    startsAt: winningTime?.startsAt ?? "",
    location: winningPlace?.label ?? "",
    deadlineAt: demo.deadlineAt,
    durationMinutes: demo.durationMinutes,
    threshold: demo.threshold,
    status,
    yesCount: fit.bestFitCount,
    bestFitCount: fit.bestFitCount,
    interestedCount: fit.interestedCount,
    remaining: Math.max(0, demo.threshold - fit.bestFitCount),
    hostName: demo.hostName,
    hostPledged: status === "confirmed" ? demo.hostPledged : null,
    hostTask: demo.hostTask,
    hostTaskDone: demo.hostTaskDone,
    timeOptions: demo.timeOptions,
    placeOptions: demo.placeOptions,
    winningTimeId,
    winningPlaceId,
    guestList: status === "confirmed" ? confirmedGuests.map((item) => ({ name: item.name, isHost: item.isHost, dayOfStatus: item.dayOfStatus })) : null,
    viewerResponse: viewer?.response ?? null,
    viewerFit: viewer ? { timeOptionIds: viewer.timeOptionIds, placeOptionIds: viewer.placeOptionIds } : null,
    viewerDayOfStatus: viewer?.dayOfStatus ?? null,
    viewerIsConfirmedGuest,
    createdAt: demo.createdAt,
    confirmedAt: demo.confirmedAt,
  };
}

export function EnoughPlanClient({ slug }: { slug: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [plan, setPlan] = useState<PlanView | null>(null);
  const [participantToken, setParticipantToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
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
    if (!raw) throw new Error("This preview plan only exists in the browser where it was created. Shared group-chat mode needs the collaboration database connection.");
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

  useEffect(() => {
    if (!plan || selectionReady) return;
    setSelectedTimes(plan.viewerFit?.timeOptionIds?.length ? plan.viewerFit.timeOptionIds : plan.timeOptions.map((item) => item.id));
    setSelectedPlaces(plan.viewerFit?.placeOptionIds?.length ? plan.viewerFit.placeOptionIds : plan.placeOptions.map((item) => item.id));
    setSelectionReady(true);
  }, [plan, selectionReady]);

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function respond(responseValue: "yes" | "no") {
    if (!plan || !participantToken || !name.trim()) { setError("Add your name first."); return; }
    if (responseValue === "yes" && !selectedTimes.length) { setError("Choose at least one time you can actually make."); return; }
    if (responseValue === "yes" && plan.placeOptions.length && !selectedPlaces.length) { setError("Choose at least one place you would actually go."); return; }
    setBusy(true); setError("");
    localStorage.setItem("enough:displayName", name.trim());
    if (email.trim()) localStorage.setItem("enough:email", email.trim());

    try {
      if (health?.persistentStoreConfigured && !slug.startsWith("demo-")) {
        const response = await fetch(`/api/enough/plans/${encodeURIComponent(slug)}/rsvp`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), response: responseValue, participantToken, timeOptionIds: responseValue === "yes" ? selectedTimes : [], placeOptionIds: responseValue === "yes" ? selectedPlaces : [] }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to save your commitment.");
        setPlan(body.view);
      } else {
        const raw = localStorage.getItem(`enough:demo:${slug}`);
        if (!raw) throw new Error("Preview plan not found.");
        const demo = JSON.parse(raw) as DemoPlan;
        const existing = demo.responses.find((item) => item.token === participantToken);
        const patch = { response: responseValue, name: name.trim(), email: email.trim(), timeOptionIds: responseValue === "yes" ? selectedTimes : [], placeOptionIds: responseValue === "yes" ? selectedPlaces : [] } as const;
        if (existing) Object.assign(existing, patch);
        else demo.responses.push({ token: participantToken, ...patch, isHost: false, dayOfStatus: null });
        const next = demoToView(demo, participantToken);
        demo.status = next.status;
        localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo));
        setPlan(next);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save your commitment."); }
    finally { setBusy(false); }
  }

  async function updatePulse(status: DayOfStatus) {
    if (!plan || !participantToken) return;
    setBusy(true); setError("");
    try {
      if (health?.persistentStoreConfigured && !slug.startsWith("demo-")) {
        const response = await fetch(`/api/enough/plans/${encodeURIComponent(slug)}/pulse`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantToken, status }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to update your status.");
        setPlan(body.view);
      } else {
        const raw = localStorage.getItem(`enough:demo:${slug}`);
        if (!raw) throw new Error("Preview plan not found.");
        const demo = JSON.parse(raw) as DemoPlan;
        const response = demo.responses.find((item) => item.token === participantToken);
        if (!response) throw new Error("You are not in this plan.");
        response.dayOfStatus = status;
        localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo));
        setPlan(demoToView(demo, participantToken));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update your status."); }
    finally { setBusy(false); }
  }

  async function share() {
    const url = window.location.href;
    const text = plan ? `${plan.emoji} ${plan.title} — Enough will only lock it in if ${plan.threshold} people can make the same version of the plan.` : "Join this plan on Enough.";
    if (navigator.share) {
      try { await navigator.share({ title: plan?.title || "Enough", text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  async function hostAction(action: "cancel" | "complete_task") {
    if (!plan) return;
    const secret = localStorage.getItem(`enough:host:${slug}`) || "";
    if (!secret) { setError("Host controls are available on the device that created the plan."); return; }
    if (action === "cancel" && !confirm("Cancel this plan for everyone?")) return;

    if (!health?.persistentStoreConfigured || slug.startsWith("demo-")) {
      const raw = localStorage.getItem(`enough:demo:${slug}`);
      if (!raw) return;
      const demo = JSON.parse(raw) as DemoPlan;
      if (action === "cancel") demo.status = "cancelled";
      if (action === "complete_task") demo.hostTaskDone = true;
      localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo));
      setPlan(demoToView(demo, participantToken));
      return;
    }

    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/enough/plans/${encodeURIComponent(slug)}/host`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, hostSecret: secret }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update plan.");
      setPlan(body.view);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update plan."); }
    finally { setBusy(false); }
  }

  const isHost = useMemo(() => typeof window !== "undefined" && Boolean(localStorage.getItem(`enough:host:${slug}`)), [slug, plan]);

  if (!plan && !error) return <div className="grid min-h-[70vh] place-items-center bg-[#f6f0e8]"><div className="text-center"><div className="mx-auto size-9 animate-spin rounded-full border-2 border-[#1e1b18]/15 border-t-[#7856ff]" /><p className="mt-4 text-sm">Finding the plan…</p></div></div>;
  if (!plan) return <div className="mx-auto max-w-2xl px-5 py-24"><div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900"><h1 className="text-2xl font-semibold">This plan is not available.</h1><p className="mt-3 text-sm leading-6">{error}</p><Link href="/enough" className="mt-5 inline-flex font-semibold underline">Create a new plan</Link></div></div>;

  const pct = Math.min(100, Math.round(plan.bestFitCount / plan.threshold * 100));
  const open = plan.status === "open";
  const confirmed = plan.status === "confirmed";
  const closed = plan.status === "expired" || plan.status === "cancelled";

  return (
    <main className="min-h-screen bg-[#f6f0e8] text-[#1e1b18]">
      <header className="border-b border-[#2a2723]/10"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><Link href="/enough" className="text-xl font-black tracking-[-0.04em]">enough<span className="text-[#7856ff]">.</span></Link><div className="flex items-center gap-2"><button onClick={share} className="rounded-full border border-[#2a2723]/15 bg-white px-4 py-2 text-sm font-semibold">{copied ? "Copied ✓" : "Share to chat ↗"}</button>{isHost && <button onClick={() => hostAction("cancel")} disabled={busy || closed} className="rounded-full px-3 py-2 text-xs font-semibold text-[#7b7168] underline disabled:opacity-40">Cancel</button>}</div></div></header>

      <div className="mx-auto max-w-5xl px-5 py-8 md:py-14">
        {!health?.persistentStoreConfigured && <div className="mb-5 rounded-2xl border border-[#7856ff]/25 bg-[#eee8ff] px-4 py-3 text-xs leading-5 text-[#4a387f]">Preview storage is active on this browser. The fit engine, reveal, and day-of hub work here; cross-device group-chat sharing activates when the collaboration database is connected.</div>}

        <section className={`overflow-hidden rounded-[2.25rem] border border-[#2a2723]/10 ${confirmed ? "bg-[#1e1b18] text-[#fffaf3]" : "bg-[#fffdf9]"} shadow-[0_32px_90px_rgba(38,31,24,0.09)]`}>
          <div className="p-7 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-14 place-items-center rounded-2xl bg-[#ffdfd4] text-3xl">{plan.emoji}</span><div><p className={`text-xs font-bold uppercase tracking-[0.15em] ${confirmed ? "text-[#cfc1ff]" : "text-[#7856ff]"}`}>{confirmed ? "Fit found · plan locked" : open ? "Private fit check" : plan.status}</p><p className={`mt-1 text-sm ${confirmed ? "text-white/55" : "text-[#756f68]"}`}>Started by {plan.hostName}</p></div></div><span className={`rounded-full px-4 py-2 text-sm font-bold ${confirmed ? "bg-[#c6f6dc] text-[#1e1b18]" : open ? "bg-[#eee8ff] text-[#4a387f]" : "bg-[#ece7e0] text-[#6f665e]"}`}>{confirmed ? "IT’S ON" : open ? `${timeLeft(plan.deadlineAt)} left` : plan.status.toUpperCase()}</span></div>
            <h1 className="mt-8 max-w-3xl text-balance text-4xl font-black tracking-[-0.055em] md:text-6xl">{plan.title}</h1>
            {plan.description && <p className={`mt-5 max-w-2xl text-base leading-7 ${confirmed ? "text-white/65" : "text-[#625b55]"}`}>{plan.description}</p>}

            {confirmed ? <div className="mt-7 flex flex-wrap gap-2 text-sm font-semibold"><span className="rounded-full bg-white/10 px-4 py-2">🗓 {formatDate(plan.startsAt)}</span>{plan.location && <a href={mapUrl(plan.location)} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 px-4 py-2 underline-offset-4 hover:underline">📍 {plan.location}</a>}</div> : <div className="mt-7 grid gap-3 md:grid-cols-2"><div className="rounded-2xl bg-[#f4eee6] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#756f68]">Possible times</p><div className="mt-3 flex flex-wrap gap-2">{plan.timeOptions.map((item) => <span key={item.id} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">{shortTime(item.startsAt)}</span>)}</div></div><div className="rounded-2xl bg-[#f4eee6] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#756f68]">Possible places</p><div className="mt-3 flex flex-wrap gap-2">{plan.placeOptions.length ? plan.placeOptions.map((item) => <span key={item.id} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">{item.label}</span>) : <span className="text-sm">Anywhere that works.</span>}</div></div></div>}

            <div className="mt-9 grid gap-5 md:grid-cols-[1fr_auto] md:items-end"><div><div className="flex items-end justify-between gap-3"><div><p className={`text-xs font-bold uppercase tracking-[0.14em] ${confirmed ? "text-white/45" : "text-[#756f68]"}`}>Best compatible group</p><p className="mt-2 text-3xl font-black">{plan.bestFitCount} / {plan.threshold}</p></div><p className={`max-w-xs text-right text-sm ${confirmed ? "text-[#c6f6dc]" : "text-[#625b55]"}`}>{confirmed ? "Enough people can make the same version." : `${plan.remaining} more compatible ${plan.remaining === 1 ? "person" : "people"} needed`}</p></div><div className={`mt-4 h-4 overflow-hidden rounded-full ${confirmed ? "bg-white/10" : "bg-[#e8e1d8]"}`}><div className={`h-full rounded-full transition-all duration-700 ${confirmed ? "bg-[#c6f6dc]" : "bg-[#7856ff]"}`} style={{ width: `${pct}%` }} /></div>{open && plan.interestedCount > plan.bestFitCount && <p className="mt-3 text-xs leading-5 text-[#756f68]">{plan.interestedCount} people are interested, but only {plan.bestFitCount} currently overlap on one time/place. Enough will not confirm a plan the group cannot actually execute.</p>}</div><div className={`rounded-2xl px-4 py-3 text-center text-xs leading-5 ${confirmed ? "bg-white/8 text-white/55" : "bg-[#f4eee6] text-[#6f665e]"}`}>{confirmed ? "Exact plan + group revealed" : "Names + individual constraints stay private"}</div></div>
          </div>

          {open && <div className="border-t border-[#2a2723]/10 bg-white p-6 md:p-8"><div className="grid gap-7 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7856ff]">Your actual fit</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Don’t vote for a favorite. Mark everything you would really do.</h2><p className="mt-3 text-sm leading-6 text-[#756f68]">Enough looks for an intersection. Your selections and name stay hidden until you are part of the combination that actually confirms.</p></div><div><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Your name" className="rounded-2xl border border-[#2a2723]/10 bg-[#faf7f2] px-4 py-3.5 outline-none focus:border-[#7856ff]" /><input aria-label="Email for unlock notification" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} placeholder="Email for unlock (optional)" className="rounded-2xl border border-[#2a2723]/10 bg-[#faf7f2] px-4 py-3.5 outline-none focus:border-[#7856ff]" /></div><p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#756f68]">I can make</p><div className="mt-2 flex flex-wrap gap-2">{plan.timeOptions.map((item) => { const active = selectedTimes.includes(item.id); return <button key={item.id} type="button" onClick={() => toggle(selectedTimes, setSelectedTimes, item.id)} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${active ? "border-[#7856ff] bg-[#eee8ff] text-[#4a387f]" : "border-[#2a2723]/15 bg-white text-[#625b55]"}`}>{active ? "✓ " : ""}{shortTime(item.startsAt)}</button>; })}</div>{plan.placeOptions.length > 0 && <><p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#756f68]">I would go to</p><div className="mt-2 flex flex-wrap gap-2">{plan.placeOptions.map((item) => { const active = selectedPlaces.includes(item.id); return <button key={item.id} type="button" onClick={() => toggle(selectedPlaces, setSelectedPlaces, item.id)} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${active ? "border-[#7856ff] bg-[#eee8ff] text-[#4a387f]" : "border-[#2a2723]/15 bg-white text-[#625b55]"}`}>{active ? "✓ " : ""}{item.label}</button>; })}</div></>}<div className="mt-6 grid gap-3 sm:grid-cols-[1.35fr_0.65fr]"><button disabled={busy} onClick={() => respond("yes")} className={`rounded-2xl px-5 py-4 text-sm font-black transition disabled:opacity-50 ${plan.viewerResponse === "yes" ? "bg-[#c6f6dc] ring-2 ring-[#1e1b18]" : "bg-[#1e1b18] text-white hover:-translate-y-0.5"}`}>{plan.viewerResponse === "yes" ? "✓ Update my private fit" : "I’m in for these versions"}</button><button disabled={busy} onClick={() => respond("no")} className={`rounded-2xl border px-5 py-4 text-sm font-bold disabled:opacity-50 ${plan.viewerResponse === "no" ? "border-[#ff8f70] bg-[#fff0eb]" : "border-[#2a2723]/15 bg-white"}`}>{plan.viewerResponse === "no" ? "✓ Not this one" : "Can’t make it"}</button></div>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}</div></div></div>}

          {confirmed && <div className="border-t border-white/10 p-7 md:p-10"><div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c6f6dc]">The plan card</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">One source of truth after the decision.</h2><div className="mt-6 flex flex-wrap gap-2">{plan.guestList?.map((guest, index) => <span key={`${guest.name}-${index}`} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">{guest.isHost ? "★ " : ""}{guest.name}{guest.dayOfStatus ? ` · ${pulseLabels.find(([key]) => key === guest.dayOfStatus)?.[1] ?? guest.dayOfStatus}` : ""}</span>)}</div></div><div className="rounded-3xl bg-white p-6 text-[#1e1b18]"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7856ff]">No more logistics scavenger hunt</p><p className="mt-3 text-xl font-black">{formatDate(plan.startsAt)}</p>{plan.location && <p className="mt-1 text-sm text-[#625b55]">{plan.location}</p>}<div className="mt-5 grid gap-2 sm:grid-cols-3"><a href={googleCalendarUrl(plan)} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#1e1b18] px-4 py-3 text-center text-sm font-bold text-white">Google Calendar ↗</a><a href={`/api/enough/plans/${plan.slug}/calendar`} className="rounded-2xl border border-[#2a2723]/15 px-4 py-3 text-center text-sm font-bold">Download .ics</a>{plan.location && <a href={mapUrl(plan.location)} target="_blank" rel="noreferrer" className="rounded-2xl border border-[#2a2723]/15 px-4 py-3 text-center text-sm font-bold">Directions ↗</a>}</div></div></div>{plan.hostTask && <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#cfc1ff]">No diffusion of responsibility</p><p className="mt-2 text-base font-semibold"><span className="text-white/55">{plan.hostName} owns:</span> {plan.hostTask}</p></div><span className={`rounded-full px-3 py-2 text-xs font-black ${plan.hostTaskDone ? "bg-[#c6f6dc] text-[#1e1b18]" : "bg-[#ffdfd4] text-[#1e1b18]"}`}>{plan.hostTaskDone ? "HANDLED ✓" : "PENDING"}</span></div>{isHost && !plan.hostTaskDone && <button disabled={busy} onClick={() => hostAction("complete_task")} className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-black text-[#1e1b18]">Mark handled</button>}</div>}{plan.viewerIsConfirmedGuest && <div className="mt-7 rounded-3xl bg-[#2a2723] p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#c6f6dc]">Day-of pulse</p><h3 className="mt-2 text-xl font-black">Skip the “where is everyone?” texts.</h3><p className="mt-2 text-sm leading-6 text-white/55">One tap updates the shared plan card for the people who are actually coming.</p><div className="mt-4 flex flex-wrap gap-2">{pulseLabels.map(([status, label]) => <button key={status} disabled={busy} onClick={() => updatePulse(status)} className={`rounded-full border px-4 py-2 text-xs font-bold ${plan.viewerDayOfStatus === status ? "border-[#c6f6dc] bg-[#c6f6dc] text-[#1e1b18]" : "border-white/15 bg-white/5 text-white"}`}>{label}</button>)}</div></div>}{error && <p className="mt-5 text-sm text-[#ffb3a1]">{error}</p>}</div>}

          {plan.status === "expired" && <div className="border-t border-[#2a2723]/10 bg-[#fff8f5] p-7"><h2 className="text-2xl font-bold">No executable quorum this time.</h2><p className="mt-2 text-sm leading-6 text-[#756f68]">{plan.interestedCount ? `${plan.interestedCount} people were interested, but the closest compatible version reached ${plan.bestFitCount}/${plan.threshold}.` : `The deadline passed before a ${plan.threshold}-person fit formed.`} No awkward cancellation message required.</p></div>}
          {plan.status === "cancelled" && <div className="border-t border-[#2a2723]/10 bg-[#fff8f5] p-7"><h2 className="text-2xl font-bold">This plan was cancelled.</h2><p className="mt-2 text-sm text-[#756f68]">The host closed this one. Nothing else you need to do.</p></div>}
        </section>

        <div className="mt-7 flex items-center justify-between gap-4 text-xs text-[#756f68]"><p>Private by link · compatible quorum · canonical plan card · day-of pulse</p><Link href="/enough" className="font-bold text-[#1e1b18] underline underline-offset-4">Throw out another plan</Link></div>
      </div>
    </main>
  );
}
