"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Health = { persistentStoreConfigured?: boolean; emailNotificationsConfigured?: boolean };

function localInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocal(value: string) {
  return new Date(value).toISOString();
}

function nextPreset(kind: "tonight" | "tomorrow" | "weekend") {
  const now = new Date();
  const start = new Date(now);
  if (kind === "tonight") {
    start.setHours(Math.max(now.getHours() + 2, 19), 30, 0, 0);
  } else if (kind === "tomorrow") {
    start.setDate(now.getDate() + 1);
    start.setHours(19, 30, 0, 0);
  } else {
    const days = (6 - now.getDay() + 7) % 7 || 7;
    start.setDate(now.getDate() + days);
    start.setHours(19, 0, 0, 0);
  }
  const deadline = new Date(Math.max(now.getTime() + 60 * 60 * 1000, start.getTime() - 4 * 60 * 60 * 1000));
  return { start: localInput(start), deadline: localInput(deadline) };
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function EnoughCreate() {
  const router = useRouter();
  const initial = useMemo(() => nextPreset("tomorrow"), []);
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("Drinks somewhere cozy");
  const [emoji, setEmoji] = useState("🍸");
  const [location, setLocation] = useState("Lower East Side");
  const [description, setDescription] = useState("Low effort, good conversation. We only lock it in if enough people are actually down.");
  const [startsAt, setStartsAt] = useState(initial.start);
  const [deadlineAt, setDeadlineAt] = useState(initial.deadline);
  const [threshold, setThreshold] = useState(4);
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [hostPledged, setHostPledged] = useState(true);

  useEffect(() => {
    fetch("/api/enough/health", { cache: "no-store" })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ persistentStoreConfigured: false }));
  }, []);

  function applyPreset(kind: "tonight" | "tomorrow" | "weekend") {
    const preset = nextPreset(kind);
    setStartsAt(preset.start);
    setDeadlineAt(preset.deadline);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      title,
      emoji,
      description,
      location,
      startsAt: fromLocal(startsAt),
      deadlineAt: fromLocal(deadlineAt),
      threshold,
      hostName,
      hostEmail,
      hostPledged,
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
        router.push(`/enough/p/${body.slug}`);
        return;
      }

      const slug = `demo-${randomToken().slice(0, 10)}`;
      const hostSecret = randomToken();
      const hostKey = `host-${randomToken()}`;
      const demo = {
        slug,
        title: title.trim(),
        emoji: emoji.trim() || "✨",
        description: description.trim(),
        location: location.trim(),
        startsAt: payload.startsAt,
        deadlineAt: payload.deadlineAt,
        threshold,
        status: "open",
        yesCount: hostPledged ? 1 : 0,
        remaining: Math.max(0, threshold - (hostPledged ? 1 : 0)),
        hostName: hostName.trim(),
        hostPledged,
        createdAt: new Date().toISOString(),
        responses: hostPledged ? [{ token: hostKey, name: hostName.trim(), email: hostEmail.trim(), response: "yes", isHost: true }] : [],
      };
      localStorage.setItem(`enough:demo:${slug}`, JSON.stringify(demo));
      localStorage.setItem(`enough:host:${slug}`, hostSecret);
      router.push(`/enough/p/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="rounded-[2rem] border border-[#2a2723]/10 bg-[#fffdf9] p-6 shadow-[0_24px_80px_rgba(38,31,24,0.08)] md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7856ff]">Throw out an idea</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1e1b18]">What would be fun?</h2></div>
          <input aria-label="Plan emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} className="h-16 w-20 rounded-2xl border border-[#2a2723]/10 bg-[#f8f3eb] text-center text-3xl outline-none focus:border-[#7856ff]" />
        </div>

        <label className="mt-7 block text-sm font-semibold text-[#1e1b18]">Plan idea
          <input required minLength={3} maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#2a2723]/10 bg-white px-4 py-3.5 text-base outline-none focus:border-[#7856ff]" placeholder="Tacos and a walk?" />
        </label>
        <label className="mt-5 block text-sm font-semibold text-[#1e1b18]">Where? <span className="font-normal text-[#756f68]">Optional</span>
          <input maxLength={160} value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#2a2723]/10 bg-white px-4 py-3.5 text-base outline-none focus:border-[#7856ff]" placeholder="Williamsburg / somewhere near Union Square" />
        </label>
        <label className="mt-5 block text-sm font-semibold text-[#1e1b18]">Tiny bit of context <span className="font-normal text-[#756f68]">Optional</span>
          <textarea maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-[#2a2723]/10 bg-white px-4 py-3.5 text-base leading-6 outline-none focus:border-[#7856ff]" />
        </label>
      </section>

      <section className="rounded-[2rem] border border-[#2a2723]/10 bg-[#1e1b18] p-6 text-[#fffaf3] shadow-[0_24px_80px_rgba(38,31,24,0.14)] md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#cfc1ff]">Make it conditional</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-[-0.04em]">This plan only unlocks if enough people are in.</h2>

        <div className="mt-7 flex flex-wrap gap-2">
          {(["tonight", "tomorrow", "weekend"] as const).map((kind) => <button key={kind} type="button" onClick={() => applyPreset(kind)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold capitalize transition hover:bg-white hover:text-[#1e1b18]">{kind === "weekend" ? "This weekend" : kind}</button>)}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Starts
            <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-[#fffaf3] outline-none [color-scheme:dark] focus:border-[#cfc1ff]" />
          </label>
          <label className="text-sm font-semibold">RSVPs close
            <input required type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-[#fffaf3] outline-none [color-scheme:dark] focus:border-[#cfc1ff]" />
          </label>
        </div>

        <label className="mt-6 block text-sm font-semibold">How many people make it worth doing?
          <div className="mt-3 flex items-center gap-4 rounded-2xl bg-white/8 p-4"><input type="range" min={2} max={12} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="min-w-0 flex-1 accent-[#cfc1ff]" /><span className="grid size-12 place-items-center rounded-2xl bg-[#cfc1ff] text-lg font-black text-[#1e1b18]">{threshold}</span></div>
        </label>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Your name
            <input required maxLength={60} value={hostName} onChange={(e) => setHostName(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-[#fffaf3] outline-none placeholder:text-white/30 focus:border-[#cfc1ff]" placeholder="Harpreet" />
          </label>
          <label className="text-sm font-semibold">Email for the unlock <span className="font-normal text-white/45">Optional</span>
            <input type="email" maxLength={160} value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-[#fffaf3] outline-none placeholder:text-white/30 focus:border-[#cfc1ff]" placeholder="you@example.com" />
          </label>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><input type="checkbox" checked={hostPledged} onChange={(e) => setHostPledged(e.target.checked)} className="mt-1 size-4 accent-[#cfc1ff]" /><span><strong className="block text-sm">Count me in if it unlocks</strong><span className="mt-1 block text-xs leading-5 text-white/55">Your commitment is hidden with everyone else's until the threshold is reached.</span></span></label>

        <button disabled={busy || !hostName.trim()} className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-[#ff8f70] px-5 py-4 text-base font-black text-[#1e1b18] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Creating…" : `Create plan · unlock at ${threshold} →`}</button>
        {error && <p className="mt-3 text-sm text-[#ffb3a1]">{error}</p>}
        {health && !health.persistentStoreConfigured && <p className="mt-4 rounded-2xl border border-[#cfc1ff]/30 bg-[#cfc1ff]/10 p-3 text-xs leading-5 text-[#e9e1ff]">Single-browser demo mode is active until the collaboration database is connected. The product flow works now; shared links become multi-device once Supabase is configured.</p>}
      </section>
    </form>
  );
}
