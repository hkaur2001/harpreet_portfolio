"use client";

import { useMemo, useState } from "react";

type SegmentId = "friends" | "roommates" | "dates";
type PainId = "options" | "commitment" | "constraints";

type Feature = {
  id: string;
  title: string;
  job: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  points: number;
  signal: string;
};

const capacity = 7;

const segments: Array<{ id: SegmentId; label: string; context: string }> = [
  { id: "friends", label: "Friend group", context: "4–8 friends making same-day plans in a noisy group chat." },
  { id: "roommates", label: "Roommates", context: "People who already share location context but still stall on what to do." },
  { id: "dates", label: "Double date", context: "Two pairs trying to find an option everyone actually wants." },
];

const pains: Array<{ id: PainId; label: string; question: string }> = [
  { id: "options", label: "Too many options", question: "How might we shrink the choice set without making the group feel railroaded?" },
  { id: "commitment", label: "No one commits", question: "How might we create a low-pressure moment where the group actually decides?" },
  { id: "constraints", label: "Hidden constraints", question: "How might we surface budget, distance, and energy level before people debate venues?" },
];

const features: Feature[] = [
  { id: "constraints", title: "One-tap constraints", job: "Collect budget, distance, time, and vibe before suggestions appear.", reach: 9, impact: 8, confidence: 9, effort: 3, points: 2, signal: "fewer dead-on-arrival options" },
  { id: "blind-vote", title: "Blind rank voting", job: "Let everyone rank a tiny shortlist before seeing the group result.", reach: 9, impact: 9, confidence: 8, effort: 4, points: 3, signal: "higher vote completion" },
  { id: "lock-timer", title: "7-minute decision lock", job: "Close voting automatically and turn the winner into the plan.", reach: 8, impact: 9, confidence: 7, effort: 2, points: 2, signal: "faster time-to-decision" },
  { id: "smart-shortlist", title: "Smart shortlist", job: "Generate three options that satisfy the group's shared constraints.", reach: 7, impact: 8, confidence: 6, effort: 7, points: 5, signal: "fewer abandoned sessions" },
  { id: "group-chat", title: "Built-in group chat", job: "Add messages, reactions, photos, and side conversation inside the product.", reach: 6, impact: 4, confidence: 7, effort: 8, points: 5, signal: "more in-app activity" },
  { id: "rewards", title: "Streaks + badges", job: "Reward groups for making plans together repeatedly.", reach: 5, impact: 3, confidence: 5, effort: 5, points: 4, signal: "possible repeat engagement" },
];

function rice(feature: Feature) {
  return (feature.reach * feature.impact * (feature.confidence / 10)) / feature.effort;
}

export function VibeCheckLab() {
  const [segment, setSegment] = useState<SegmentId>("friends");
  const [pain, setPain] = useState<PainId>("commitment");
  const [selected, setSelected] = useState<string[]>(["constraints", "blind-vote", "lock-timer"]);
  const [shipped, setShipped] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedFeatures = useMemo(() => features.filter((feature) => selected.includes(feature.id)), [selected]);
  const pointsUsed = selectedFeatures.reduce((sum, feature) => sum + feature.points, 0);
  const selectedSegment = segments.find((item) => item.id === segment) ?? segments[0];
  const selectedPain = pains.find((item) => item.id === pain) ?? pains[0];
  const ranked = [...features].sort((a, b) => rice(b) - rice(a));

  function toggleFeature(feature: Feature) {
    setShipped(false);
    setNotice("");
    if (selected.includes(feature.id)) {
      setSelected((current) => current.filter((id) => id !== feature.id));
      return;
    }
    if (pointsUsed + feature.points > capacity) {
      setNotice(`That would use ${pointsUsed + feature.points}/${capacity} build points. Cut something first.`);
      return;
    }
    setSelected((current) => [...current, feature.id]);
  }

  function reset() {
    setSegment("friends");
    setPain("commitment");
    setSelected(["constraints", "blind-vote", "lock-timer"]);
    setShipped(false);
    setNotice("");
  }

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">Interactive product lab</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">Build the MVP with a 7-point budget.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">This is a product-sense exercise, not a claim of completed user research. Choose the user and pain, then make the tradeoff: what earns scarce MVP capacity?</p>
        </div>
        <button type="button" onClick={reset} className="btn-secondary">Reset</button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-[var(--bg)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">1 · Pick the user</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {segments.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setSegment(item.id); setShipped(false); }}
                className={segment === item.id ? "btn-primary rounded-full px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{selectedSegment.context}</p>
        </section>

        <section className="rounded-3xl bg-[var(--bg)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">2 · Pick the pain</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {pains.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setPain(item.id); setShipped(false); }}
                className={pain === item.id ? "btn-primary rounded-full px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{selectedPain.question}</p>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-[var(--line)] pt-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">3 · Prioritize the MVP</p>
          <p className="mt-2 text-sm text-[var(--muted)]">RICE is shown as a forcing function; the build-point budget forces the actual decision.</p>
        </div>
        <div className="text-right"><p className="font-mono text-2xl font-semibold">{pointsUsed}/{capacity}</p><p className="text-xs text-[var(--muted)]">build points used</p></div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ranked.map((feature, index) => {
          const active = selected.includes(feature.id);
          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => toggleFeature(feature)}
              className={`rounded-2xl border p-5 text-left transition ${active ? "border-[var(--ink)] bg-[var(--soft)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--muted)]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-[var(--signal)]">#{index + 1} RICE · {rice(feature).toFixed(1)}</span>
                <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[10px]">{feature.points} pts</span>
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{feature.job}</p>
              <p className="mt-4 text-[11px] font-medium">Signal: {feature.signal}</p>
              <p className="mt-3 text-[11px] font-semibold">{active ? "Selected — click to cut" : "Click to add"}</p>
            </button>
          );
        })}
      </div>

      {notice && <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm">{notice}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => { setShipped(true); setNotice(""); }}
          disabled={selected.length === 0}
          className="btn-primary rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ship this MVP →
        </button>
        <p className="text-xs text-[var(--muted)]">The point is not to select everything. The point is to defend what you leave out.</p>
      </div>

      {shipped && (
        <section className="mt-7 rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6" aria-live="polite">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal)]">MVP decision</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Ship {selectedFeatures.map((feature) => feature.title).join(" + ")}.</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Product hypothesis</p><p className="mt-3 text-sm leading-6">For {selectedSegment.label.toLowerCase()}s struggling with “{pains.find((item) => item.id === pain)?.label.toLowerCase()},” a constrained decision flow will reduce coordination friction enough to get more groups to a confirmed plan.</p></div>
            <div className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">North-star candidate</p><p className="mt-3 text-sm leading-6"><strong>Plans confirmed within 10 minutes of the first invite.</strong> It measures the user outcome—decision velocity—not vanity engagement.</p></div>
            <div className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Experiment</p><p className="mt-3 text-sm leading-6">A/B test the MVP against an open-ended planning flow. Roll out only if confirmed-plan completion improves by at least 15 percentage points while cancellation does not materially worsen.</p></div>
            <div className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Guardrails</p><p className="mt-3 text-sm leading-6">Track invite acceptance, vote completion, post-plan cancellation, time to decision, and “I actually liked this plan” feedback. A faster bad decision is still a bad product.</p></div>
          </div>
          <div className="mt-5 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--ink)]">Explicitly not in v1:</strong> {features.filter((feature) => !selected.includes(feature.id)).map((feature) => feature.title).join(", ") || "nothing—you spent the whole budget."}</div>
        </section>
      )}
    </div>
  );
}
