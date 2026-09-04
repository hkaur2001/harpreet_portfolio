import { NextRequest, NextResponse } from "next/server";
import { fetchJsonWithRetry, openAiUrl } from "@/lib/resilient-fetch";

export const runtime = "nodejs";

type Judge = {
  styleFidelity: number;
  briefAdherence: number;
  platformFit: number;
  originality: number;
  copyRisk: "low" | "medium" | "high";
  notes: string;
};

type VoiceBundle = { styleProfile?: string; draft?: string };

type ResponseBody = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

function responseText(body: unknown) {
  const response = body as ResponseBody;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return "";
}

async function callModel(apiKey: string, input: string, maxOutputTokens = 900) {
  return fetchJsonWithRetry<ResponseBody>(openAiUrl("responses"), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, max_output_tokens: maxOutputTokens, store: false, input }),
  }, { attempts: 3, baseDelayMs: 250, maxDelayMs: 1400, timeoutMs: 25_000 });
}

async function embed(apiKey: string, input: string[]) {
  return fetchJsonWithRetry<{ data?: Array<{ embedding?: number[] }>; usage?: { total_tokens?: number } }>(openAiUrl("embeddings"), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input }),
  }, { attempts: 3, baseDelayMs: 220, maxDelayMs: 1200, timeoutMs: 15_000 });
}

function cosine(a: number[], b: number[]) {
  let dot = 0; let a2 = 0; let b2 = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) { dot += a[i] * b[i]; a2 += a[i] * a[i]; b2 += b[i] * b[i]; }
  return dot / (Math.sqrt(a2) * Math.sqrt(b2) || 1);
}

function tokens(text: string) {
  return new Set(text.toLowerCase().match(/[a-z0-9']+/g) ?? []);
}

function lexicalScore(brief: string, sample: string) {
  const q = tokens(brief);
  const s = tokens(sample);
  let overlap = 0;
  q.forEach((token) => { if (s.has(token)) overlap += 1; });
  return overlap / Math.max(1, q.size);
}

function longestSharedRun(a: string, b: string) {
  const x = a.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const y = b.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  let best = 0;
  const dp = Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i += 1) {
    let previous = 0;
    for (let j = 1; j <= y.length; j += 1) {
      const temp = dp[j];
      dp[j] = x[i - 1] === y[j - 1] ? previous + 1 : 0;
      best = Math.max(best, dp[j]);
      previous = temp;
    }
  }
  return best;
}

function clampScore(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, Math.round(n))) : 3;
}

function parseJudge(text: string): Judge {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<Judge>;
    return {
      styleFidelity: clampScore(parsed.styleFidelity),
      briefAdherence: clampScore(parsed.briefAdherence),
      platformFit: clampScore(parsed.platformFit),
      originality: clampScore(parsed.originality),
      copyRisk: parsed.copyRisk === "high" || parsed.copyRisk === "medium" ? parsed.copyRisk : "low",
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return { styleFidelity: 3, briefAdherence: 3, platformFit: 3, originality: 3, copyRisk: "low", notes: "The semantic judge was unavailable; objective copy-risk checks still ran." };
  }
}

function parseVoiceBundle(text: string): VoiceBundle {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    return JSON.parse(text.slice(start, end + 1)) as VoiceBundle;
  } catch {
    return {};
  }
}

function heuristicProfile(samples: string[]) {
  const joined = samples.join(" ");
  const sentences = joined.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  const averageWords = Math.round(sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0) / Math.max(1, sentences.length));
  const firstPerson = /\b(I|we|my|our)\b/i.test(joined);
  const questions = (joined.match(/\?/g) ?? []).length;
  const exclamations = (joined.match(/!/g) ?? []).length;
  const emojis = /[\u{1F300}-\u{1FAFF}]/u.test(joined);
  return `Typical sentence length is about ${averageWords} words. The voice is ${firstPerson ? "personal and first-person" : "more observational than personal"}, ${questions ? "occasionally uses questions" : "rarely relies on questions"}, ${exclamations ? "uses selective emphasis" : "keeps punctuation restrained"}, and ${emojis ? "sometimes uses emoji" : "does not depend on emoji"}. Preserve clear paragraph breaks and avoid copying distinctive phrases from the examples.`;
}

function fallbackDraft(brief: string, format: string, profile: string) {
  const cleanBrief = brief.replace(/\s+/g, " ").trim();
  const hook = cleanBrief.charAt(0).toUpperCase() + cleanBrief.slice(1).replace(/[.!?]+$/, "");
  if (/script/i.test(format)) {
    return `${hook}.\n\nHere is the part I would focus on: what changed, what I learned from it, and what I would carry forward.\n\n${profile.includes("personal and first-person") ? "The useful part for me is turning the experience into something concrete rather than treating it as a milestone on its own." : "The useful part is turning the experience into something concrete rather than treating it as a milestone on its own."}`;
  }
  return `${hook}.\n\nWhat matters most is not just the milestone itself, but the work, lessons, and people behind it. I would use the moment to reflect on what changed, what became clearer, and what I want to build next.\n\nOnward.`;
}

function deterministicJudge(draft: string, samples: string[], longestCopy: number): Judge {
  const sampleWords = new Set(samples.join(" ").toLowerCase().match(/[a-z0-9']+/g) ?? []);
  const draftWords = draft.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const overlap = draftWords.filter((word) => sampleWords.has(word)).length / Math.max(1, draftWords.length);
  return {
    styleFidelity: overlap > 0.25 ? 3 : 2,
    briefAdherence: 3,
    platformFit: 3,
    originality: longestCopy >= 8 ? 2 : longestCopy >= 6 ? 3 : 4,
    copyRisk: longestCopy >= 8 ? "high" : longestCopy >= 6 ? "medium" : "low",
    notes: "Provider-side judging was unavailable; the fallback score uses lexical overlap and exact phrase-copy checks only.",
  };
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const { samples: rawSamples, brief: rawBrief, format: rawFormat } = await request.json() as { samples?: string; brief?: string; format?: string };
    const samples = (rawSamples ?? "").split(/\n\s*---\s*\n/g).map((item) => item.trim()).filter(Boolean);
    const brief = (rawBrief ?? "").trim();
    const format = (rawFormat ?? "LinkedIn post").trim();
    if (samples.length < 3 || samples.length > 20) return NextResponse.json({ error: "Provide between 3 and 20 writing samples separated by ---." }, { status: 400 });
    if (samples.some((sample) => sample.length < 30 || sample.length > 3000)) return NextResponse.json({ error: "Each sample must be between 30 and 3,000 characters." }, { status: 400 });
    if (samples.join("\n").length > 20_000) return NextResponse.json({ error: "The combined writing samples are too long for this public demo." }, { status: 400 });
    if (brief.length < 10 || brief.length > 1000) return NextResponse.json({ error: "The content brief must be between 10 and 1,000 characters." }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    const degradedReasons: string[] = [];
    let providerRetries = 0;

    let retrieved = samples.map((sample, index) => ({ index, sample, score: lexicalScore(brief, sample) })).sort((a, b) => b.score - a.score).slice(0, Math.min(4, samples.length));
    let retrievalMode = "lexical fallback";

    if (apiKey) {
      try {
        const embedded = await embed(apiKey, [brief, ...samples]);
        providerRetries += embedded.retries;
        const vectors = embedded.data.data?.map((item) => item.embedding ?? []) ?? [];
        if (vectors.length === samples.length + 1) {
          const [query, ...sampleVectors] = vectors;
          retrieved = samples.map((sample, index) => ({ index, sample, score: cosine(query, sampleVectors[index]) })).sort((a, b) => b.score - a.score).slice(0, Math.min(4, samples.length));
          retrievalMode = "text-embedding-3-small + cosine similarity";
        } else {
          degradedReasons.push("Embedding response was incomplete; lexical retrieval was used.");
        }
      } catch {
        degradedReasons.push("Embedding service was busy or unavailable; lexical retrieval was used.");
      }
    } else {
      degradedReasons.push("Live model configuration is unavailable; deterministic fallback mode is active.");
    }

    const fallbackProfile = heuristicProfile(samples);
    let styleProfile = fallbackProfile;
    let draft = fallbackDraft(brief, format, fallbackProfile);
    let generationMode = "deterministic fallback";
    const examples = retrieved.map((item) => `[sample-${item.index + 1}] ${item.sample}`).join("\n\n");

    if (apiKey) {
      try {
        const generated = await callModel(apiKey, `Analyze the recurring writing style and then create a fresh ${format}. Return JSON only with this shape: {"styleProfile":"...","draft":"..."}.\n\nBRIEF:\n${brief}\n\nSTYLE EXAMPLES:\n${examples}\n\nRules:\n- The style profile should describe sentence rhythm, formality, structure, point of view, rhetorical habits, punctuation, calls to action, and what the writer tends to avoid.\n- The draft must satisfy the brief and match recurring patterns without copying distinctive phrases.\n- Do not copy any sequence longer than six words from the samples.\n- Do not invent facts not present in the brief.`, 1250);
        providerRetries += generated.retries;
        const bundle = parseVoiceBundle(responseText(generated.data));
        if (bundle.styleProfile?.trim()) styleProfile = bundle.styleProfile.trim();
        if (bundle.draft?.trim()) draft = bundle.draft.trim();
        if (bundle.draft?.trim()) generationMode = "gpt-5.6-luna";
        else degradedReasons.push("The generation response could not be parsed; a deterministic draft was returned.");
      } catch {
        degradedReasons.push("The generation provider was rate-limited or unavailable; a deterministic draft was returned instead of failing the request.");
      }
    }

    let longestCopy = Math.max(...samples.map((sample) => longestSharedRun(draft, sample)));
    let evaluation = deterministicJudge(draft, samples, longestCopy);
    let judgeMode = "deterministic fallback";

    if (apiKey && generationMode === "gpt-5.6-luna") {
      try {
        const judged = await callModel(apiKey, `Grade the generated content against the writing samples and brief. Return JSON only with this exact shape: {"styleFidelity":1,"briefAdherence":1,"platformFit":1,"originality":1,"copyRisk":"low","notes":""}. Scores are integers 1-5. Style fidelity asks whether the draft matches recurring tone and structure without parroting. Brief adherence asks whether it fulfills the requested topic. Platform fit asks whether the format suits ${format}. Originality penalizes copying. copyRisk is low, medium, or high.\n\nBRIEF:\n${brief}\n\nSTYLE PROFILE:\n${styleProfile}\n\nSAMPLES:\n${samples.join("\n---\n")}\n\nDRAFT:\n${draft}`, 400);
        providerRetries += judged.retries;
        evaluation = parseJudge(responseText(judged.data));
        judgeMode = "gpt-5.6-luna";
      } catch {
        degradedReasons.push("The semantic evaluation provider was unavailable; deterministic copy-risk checks were used.");
      }
    }

    if (longestCopy >= 8) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 2), copyRisk: "high" };
    else if (longestCopy >= 6) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 3), copyRisk: "medium" };

    let revisionPerformed = false;
    if (apiKey && generationMode === "gpt-5.6-luna" && (evaluation.styleFidelity < 4 || evaluation.briefAdherence < 4 || evaluation.originality < 4 || evaluation.copyRisk === "high")) {
      try {
        const revised = await callModel(apiKey, `Revise the draft once. Preserve the brief, improve the voice match, and remove wording that is too close to the samples. Do not invent facts. Output only the revised ${format}.\n\nVOICE PROFILE:\n${styleProfile}\n\nBRIEF:\n${brief}\n\nCURRENT DRAFT:\n${draft}\n\nEVALUATION NOTES:\n${evaluation.notes}`, 900);
        providerRetries += revised.retries;
        const revision = responseText(revised.data).trim();
        if (revision) {
          draft = revision;
          revisionPerformed = true;
          longestCopy = Math.max(...samples.map((sample) => longestSharedRun(draft, sample)));
          if (longestCopy >= 8) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 2), copyRisk: "high" };
          else if (longestCopy >= 6) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 3), copyRisk: "medium" };
        }
      } catch {
        degradedReasons.push("The optional revision pass was unavailable; the evaluated first draft was preserved.");
      }
    }

    return NextResponse.json({
      draft,
      styleProfile,
      retrieved: retrieved.map((item) => ({ index: item.index, score: Number(item.score.toFixed(3)), excerpt: item.sample.slice(0, 180) + (item.sample.length > 180 ? "…" : "") })),
      evaluation: { ...evaluation, revisionPerformed },
      metrics: {
        model: generationMode,
        retrieval: retrievalMode,
        judge: judgeMode,
        providerRetries,
        degraded: degradedReasons.length > 0,
        degradedReasons,
        latencyMs: Date.now() - started,
        sampleCount: samples.length,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The request could not be parsed or validated. Please retry with the same samples." }, { status: 400 });
  }
}
