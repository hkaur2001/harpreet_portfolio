"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Health = { persistentStoreConfigured?: boolean };
type DraftTime = { value: string };
type DraftPlace = { value: string };

function localInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocal(value: string) {
  return new Date(value).toISOString();
}

function preset(kind: "tonight" | "tomorrow" | "weekend") {
  const now = new Date();
  const first = new Date(now);
  const second = new Date(now);
  if (kind === "tonight") {
    first.setHours(Math.max(now.getHours() + 2, 19), 0, 0, 0);
    second.setTime(first.getTime() + 90 * 60_000);
  } else if (kind === "tomorrow") {
    first.setDate(now.getDate() + 1);
    first.setHours(19, 0, 0, 0);
    second.setTime(first.getTime() + 90 * 60_000);
  } else {
    const days = (6 - now.getDay() + 7) % 7 || 7;
    first.setDate(now.getDate() + days);
    first.setHours(19, 0, 0, 0);
    second.setTime(first.getTime());
    second.setDate(first.getDate() + 1);
    second.setHours(13, 0, 0, 0);
  }
  const earliest = Math.min(first.getTime(), second.getTime());
  const deadline = new Date(Math.max(now.getTime() + 45 * 60_000, earliest - 4 * 60 * 60_000));
  return { times: [{ value: localInput(first) }, { value: localInput(second) }], deadline: localInput(deadline) };
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function EnoughCreate() {
  const router = useRouter();
  const initial = useMemo(() => preset("tomorrow"), []);
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("Dinner + a walk");
  const [emoji, setEmoji] = useState("🍜");
  const [description, setDescription] = useState("I’m down if we can get a real little crew together. Pick every time/place you would genuinely show up for.");
  const [times, setTimes] = useState<DraftTime[]>(initial.times);
  const [places, setPlaces] = useState<DraftPlace[]>([{ value: "East Village" }, { value: "Lower East Side" }]);
  const [deadlineAt, setDeadlineAt] = useState(initial.deadline);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [threshold, setThreshold] = useState(4);
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [hostPledged, setHostPledged] = useState(true);
  const [hostTask, setHostTask] = useState("Make the reservation");

  useEffect(() => {
    fetch("/api/enough/health", { cache: "no-store" })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ persistentStoreConfigured: false }));
  }, []);

  function applyPreset(kind: "tonight" | "tomorrow" | "weekend") {
    const next = preset(kind);
    setTimes(next.times);
    setDeadlineAt(next.deadline);
  }

  function updateTime(index: number, value: string) {
    setTimes((current) => current.map((item, i) => i === index ? { value } : item));
  }

  function updatePlace(index: number, value: string) {
    setPlaces((current) => current.map((item, i) => i === index ? { value } : item));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const cleanTimes = times.map((item) => item.value).filter(Boolean);
    const cleanPlaces = places.map((item) => item.value.trim()).filter(Boolean);
    if (!cleanTimes.length) {
      setError("Add at least one possible time.");
      setBusy(false);
      return;
    }

    const payload = {
      title,
      emoji,
      description,
      timeOptions: cleanTimes.map((startsAt) => ({ startsAt: fromLocal(startsAt) })),
      placeOptions: cleanPlaces.map((label) => ({ label })),
      deadlineAt: fromLocal(deadlineAt),
      durationMinutes,
      threshold,
      hostName,
      hostEmail,
      hostPledged,
      hostTask,
    };

    try {
      if (health?.persistentStoreConfigured) {
        const response = await fetch("/api/enough/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not create the plan.");
        localStorage.setItem(`enough:host:${body.slug}`, body.hostSecret);
        if (body.hostParticipantToken) localStorage.setItem(`enough:participant:${body.slug}`, body.hostParticipantToken);
        router.push(`/enough/p/${body.slug}`);
        return;
      }

      const slug = `demo-${randomToken().slice(0, 10)}`;
      const hostSecret = randomToken();
      const timeOptions = cleanTimes.map((startsAt, index) => ({ id: `t${index + 1}`, startsAt: fromLocal(startsAt) }));
      const placeOptions = cleanPlaces.map((label, index) => ({ id: `p${index + 1}`, label }));
      const demo = {
        slug,
        title: title.trim(),
        emoji: emoji.trim() || "✨",
        description: description.trim(),
        deadlineAt: payload.deadlineAt,
        durationMinutes,
        threshold,
        status: "open",
        hostName: hostName.trim(),
        hostPledged,
        hostTask: hostTask.trim(),
        hostTaskDone: false,
        timeOptions,
        placeOptions,
        winningTimeId: null,
        winningPlaceId: null,
        createdAt: new Date().toISOString(),
        confirmedAt: null,
        responses: hostPledged ? [{ token: hostSecret, name: hostName.trim(), email: hostEmail.trim(), response: "yes", isHost: true, timeOptionIds: timeOptions.map((item) => item.id), placeOptionIds: placeOptions.map((item) => item.id), dayOfStatus: null }] : [],
      };
      localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo));
      localStorage.setItem(`enough:host:${slug}`, hostSecret);
      localStorage.setItem(`enough:participant:${slug}`, hostSecret);
      router.push(`/enough/p/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-[#2a2723]/10 bg-[#fffdf9] p-6 shadow-[0_24px_80px_rgba(38,31,24,0.08)] md:p-8">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7856ff]">01 · Throw out the idea</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Keep it casual.</h2></div><input aria-label="Plan emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} className="h-16 w-20 rounded-2xl border border-[#2a2723]/10 bg-[#f8f3eb] text-center text-3xl outline-none focus:border-[#7856ff]" /></div>
        <label className="mt-7 block text-sm font-semibold">What are you thinking?<input required minLength={3} maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#2a2723]/10 bg-white px-4 py-3.5 text-base outline-none focus:border-[#7856ff]" placeholder="Tacos + karaoke?" /></label>
        <label className="mt-5 block text-sm font-semibold">Tiny bit of context <span className="font-normal text-[#756f68]">Optional</span><textarea maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-[#2a2723]/10 bg-white px-4 py-3.5 text-base leading-6 outline-none focus:border-[#7856ff]" /></label>
        <div className="mt-6 rounded-2xl bg-[#f4eee6] p-4"><p className="text-xs font-black uppercase tracking-[0.13em] text-[#756f68]">Why this is not a poll</p><p className="mt-2 text-sm leading-6 text-[#625b55]">Friends do not pick one favorite. They privately mark <strong>every version they can actually make</strong>. Enough looks for a compatible group, not a plurality winner.</p></div>
      </section>

      <section className="rounded-[2rem] border border-[#2a2723]/10 bg-[#1e1b18] p-6 text-[#fffaf3] shadow-[0_24px_80px_rgba(38,31,24,0.14)] md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#cfc1ff]">02 · Define what can work</p><h2 className="mt-2 max-w-xl text-3xl font-black tracking-[-0.04em]">Give the group a small compatibility envelope.</h2>
        <div className="mt-6 flex flex-wrap gap-2">{(["tonight", "tomorrow", "weekend"] as const).map((kind) => <button key={kind} type="button" onClick={() => applyPreset(kind)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold capitalize transition hover:bg-white hover:text-[#1e1b18]">{kind === "weekend" ? "This weekend" : kind}</button>)}</div>

        <div className="mt-6"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Possible times</p><button type="button" disabled={times.length >= 4} onClick={() => setTimes((current) => [...current, { value: current.at(-1)?.value || "" }])} className="text-xs font-bold text-[#cfc1ff] disabled:opacity-35">+ add time</button></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{times.map((item, index) => <div key={index} className="flex gap-2"><input required type="datetime-local" value={item.value} onChange={(e) => updateTime(index, e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/8 px-3 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-[#cfc1ff]" />{times.length > 1 && <button type="button" aria-label={`Remove time ${index + 1}`} onClick={() => setTimes((current) => current.filter((_, i) => i !== index))} className="rounded-xl border border-white/10 px-3 text-white/45">×</button>}</div>)}</div></div>

        <div className="mt-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Possible places <span className="font-normal text-white/45">Optional</span></p><button type="button" disabled={places.length >= 4} onClick={() => setPlaces((current) => [...current, { value: "" }])} className="text-xs font-bold text-[#cfc1ff] disabled:opacity-35">+ add place</button></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{places.map((item, index) => <div key={index} className="flex gap-2"><input maxLength={160} value={item.value} onChange={(e) => updatePlace(index, e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/8 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#cfc1ff]" placeholder={index === 0 ? "East Village" : "Williamsburg"} />{places.length > 1 && <button type="button" aria-label={`Remove place ${index + 1}`} onClick={() => setPlaces((current) => current.filter((_, i) => i !== index))} className="rounded-xl border border-white/10 px-3 text-white/45">×</button>}</div>)}</div></div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Commitments close<input required type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-[#cfc1ff]" /></label><label className="text-sm font-semibold">Rough duration<select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-white/15 bg-[#2b2825] px-4 py-3 text-sm text-white outline-none focus:border-[#cfc1ff]"><option value={60}>1 hour</option><option value={90}>1.5 hours</option><option value={120}>2 hours</option><option value={180}>3 hours</option><option value={240}>4 hours</option></select></label></div>

        <label className="mt-5 block text-sm font-semibold">How many compatible people make it worth doing?<div className="mt-3 flex items-center gap-4 rounded-2xl bg-white/8 p-4"><input type="range" min={2} max={12} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="min-w-0 flex-1 accent-[#cfc1ff]" /><span className="grid size-12 place-items-center rounded-2xl bg-[#cfc1ff] text-lg font-black text-[#1e1b18]">{threshold}</span></div></label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Your name<input required maxLength={60} value={hostName} onChange={(e) => setHostName(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#cfc1ff]" placeholder="Harpreet" /></label><label className="text-sm font-semibold">Email for unlock <span className="font-normal text-white/45">Optional</span><input type="email" maxLength={160} value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#cfc1ff]" placeholder="you@example.com" /></label></div>
        <label className="mt-5 block text-sm font-semibold">If it unlocks, I’ll… <span className="font-normal text-white/45">Optional</span><input maxLength={120} value={hostTask} onChange={(e) => setHostTask(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#cfc1ff]" placeholder="book the table / buy tickets / bring the speaker" /></label>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><input type="checkbox" checked={hostPledged} onChange={(e) => setHostPledged(e.target.checked)} className="mt-1 size-4 accent-[#cfc1ff]" /><span><strong className="block text-sm">Count me as flexible across all options</strong><span className="mt-1 block text-xs leading-5 text-white/55">If you need stricter availability, turn this off and respond from the plan link like everyone else.</span></span></label>
        <button disabled={busy || !hostName.trim()} className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-[#ff8f70] px-5 py-4 text-base font-black text-[#1e1b18] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Creating…" : `Find a real ${threshold}-person fit →`}</button>
        {error && <p className="mt-3 text-sm text-[#ffb3a1]">{error}</p>}
        {health && !health.persistentStoreConfigured && <p className="mt-4 rounded-2xl border border-[#cfc1ff]/30 bg-[#cfc1ff]/10 p-3 text-xs leading-5 text-[#e9e1ff]">Preview storage is active in this browser. Shared group-chat links become multi-device as soon as the Supabase connection is attached.</p>}
      </section>
    </form>
  );
}
