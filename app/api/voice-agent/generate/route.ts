import { NextRequest, NextResponse } from "next/server";
import { fetchJsonWithRetry, openAiUrl } from "@/lib/resilient-fetch";
import { huggingFaceChat, huggingFaceConfigured } from "@/lib/huggingface-provider";

export const runtime = "nodejs";
export const maxDuration = 60;

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

type RetrievalInput = {
  model?: string;
  engine?: string;
  ranked?: Array<{ index?: number; score?: number }>;
};

type ProviderText = {
  text: string;
  label: string;
  retries: number;
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

async function callOpenAI(apiKey: string, input: string, maxOutputTokens = 900): Promise<ProviderText> {
  const response = await fetchJsonWithRetry<ResponseBody>(openAiUrl("responses"), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      max_output_tokens: maxOutputTokens,
      store: false,
      input,
    }),
  }, { attempts: 3, baseDelayMs: 250, maxDelayMs: 1400, timeoutMs: 25_000 });

  const text = responseText(response.data).trim();
  if (!text) throw new Error("OpenAI returned an empty response.");
  return { text, label: "gpt-5.6-luna · OpenAI", retries: response.retries };
}

async function callGeneration(input: string, maxOutputTokens: number): Promise<ProviderText> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      return await callOpenAI(apiKey, input, maxOutputTokens);
    } catch {
      // A second provider can keep the workflow live when one vendor is unavailable.
    }
  }

  if (huggingFaceConfigured()) {
    const result = await huggingFaceChat(input, { purpose: "generation", maxTokens: maxOutputTokens, temperature: 0.35 });
    return { text: result.text, label: `${result.model} · Hugging Face`, retries: result.retries };
  }

  throw new Error("No live generation provider was available.");
}

async function callJudge(input: string): Promise<ProviderText> {
  // Prefer an independent open model when configured so generation and grading are not always done by the same model family.
  if (huggingFaceConfigured()) {
    try {
      const result = await huggingFaceChat(input, { purpose: "judge", maxTokens: 450, temperature: 0 });
      return { text: result.text, label: `${result.model} · Hugging Face`, retries: result.retries };
    } catch {
      // Fall through to OpenAI if the open-model provider is unavailable.
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) return callOpenAI(apiKey, input, 450);
  throw new Error("No live evaluation provider was available.");
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

function clientRetrieval(
  input: RetrievalInput | undefined,
  samples: string[],
): Array<{ index: number; sample: string; score: number }> | null {
  if (!input?.ranked?.length) return null;
  const seen = new Set<number>();
  const ranked: Array<{ index: number; sample: string; score: number }> = [];

  for (const item of input.ranked) {
    const index = Number(item.index);
    const score = Number(item.score);
    if (!Number.isInteger(index) || index < 0 || index >= samples.length || seen.has(index) || !Number.isFinite(score)) continue;
    seen.add(index);
    ranked.push({ index, sample: samples[index], score: Math.max(-1, Math.min(1, score)) });
    if (ranked.length >= Math.min(4, samples.length)) break;
  }

  return ranked.length ? ranked : null;
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
    if (start < 0 || end <= start) throw new Error("No JSON object found.");
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
    return { styleFidelity: 3, briefAdherence: 3, platformFit: 3, originality: 3, copyRisk: "low", notes: "The semantic judge output could not be parsed; objective copy-risk checks still ran." };
  }
}

function parseVoiceBundle(text: string): VoiceBundle {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object found.");
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

function fallbackDraft(brief: string, format: string) {
  const cleanBrief = brief.replace(/\s+/g, " ").trim();
  const hook = cleanBrief.charAt(0).toUpperCase() + cleanBrief.slice(1).replace(/[.!?]+$/, "");
  if (/script/i.test(format)) {
    return `${hook}.\n\nHere is what I would focus on: what changed, what I learned from it, and what I would carry forward.\n\nThe useful part is turning the experience into something concrete rather than treating it as a milestone on its own.`;
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
    const payload = await request.json() as {
      samples?: string;
      brief?: string;
      format?: string;
      retrieval?: RetrievalInput | null;
      localRetrievalError?: string;
    };

    const samples = (payload.samples ?? "").split(/\n\s*---\s*\n/g).map((item) => item.trim()).filter(Boolean);
    const brief = (payload.brief ?? "").trim();
    const format = (payload.format ?? "LinkedIn post").trim();
    if (samples.length < 3 || samples.length > 20) return NextResponse.json({ error: "Provide between 3 and 20 writing samples separated by ---." }, { status: 400 });
    if (samples.some((sample) => sample.length < 30 || sample.length > 3000)) return NextResponse.json({ error: "Each sample must be between 30 and 3,000 characters." }, { status: 400 });
    if (samples.join("\n").length > 20_000) return NextResponse.json({ error: "The combined writing samples are too long for this public demo." }, { status: 400 });
    if (brief.length < 10 || brief.length > 1000) return NextResponse.json({ error: "The content brief must be between 10 and 1,000 characters." }, { status: 400 });

    const degradedReasons: string[] = [];
    let providerRetries = 0;

    const local = clientRetrieval(payload.retrieval ?? undefined, samples);
    let retrieved: Array<{ index: number; sample: string; score: number }>;
    let retrievalMode: string;

    if (local) {
      retrieved = local;
      const engine = payload.retrieval?.engine?.slice(0, 120) || "Hugging Face Transformers.js";
      const model = payload.retrieval?.model?.slice(0, 120) || "browser-local embedding model";
      retrievalMode = `${model} · ${engine}`;
    } else {
      retrieved = samples
        .map((sample, index) => ({ index, sample, score: lexicalScore(brief, sample) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(4, samples.length));
      retrievalMode = "lexical retrieval fallback";
      if (payload.localRetrievalError) degradedReasons.push("The browser-local Hugging Face embedding model was unavailable; lexical retrieval was used for this run.");
    }

    const fallbackProfile = heuristicProfile(samples);
    let styleProfile = fallbackProfile;
    let draft = fallbackDraft(brief, format);
    let generationMode = "deterministic fallback";
    const examples = retrieved.map((item) => `[sample-${item.index + 1}] ${item.sample}`).join("\n\n");

    try {
      const generated = await callGeneration(`Analyze the recurring writing style and then create a fresh ${format}. Return JSON only with this shape: {"styleProfile":"...","draft":"..."}.\n\nBRIEF:\n${brief}\n\nSTYLE EXAMPLES:\n${examples}\n\nRules:\n- The style profile should describe sentence rhythm, formality, structure, point of view, rhetorical habits, punctuation, calls to action, and what the writer tends to avoid.\n- The draft must satisfy the brief and match recurring patterns without copying distinctive phrases.\n- Do not copy any sequence longer than six words from the samples.\n- Do not invent facts not present in the brief.`, 1250);
      providerRetries += generated.retries;
      const bundle = parseVoiceBundle(generated.text);
      if (bundle.styleProfile?.trim()) styleProfile = bundle.styleProfile.trim();
      if (bundle.draft?.trim()) draft = bundle.draft.trim();
      if (bundle.draft?.trim()) generationMode = generated.label;
      else degradedReasons.push("The generation response could not be parsed; a deterministic draft was returned.");
    } catch {
      degradedReasons.push("Live generation providers were unavailable; a deterministic draft was returned instead of failing the request.");
    }

    let longestCopy = Math.max(...samples.map((sample) => longestSharedRun(draft, sample)));
    let evaluation = deterministicJudge(draft, samples, longestCopy);
    let judgeMode = "deterministic fallback";

    if (generationMode !== "deterministic fallback") {
      try {
        const judged = await callJudge(`Grade the generated content against the writing samples and brief. Return JSON only with this exact shape: {"styleFidelity":1,"briefAdherence":1,"platformFit":1,"originality":1,"copyRisk":"low","notes":""}. Scores are integers 1-5. Style fidelity asks whether the draft matches recurring tone and structure without parroting. Brief adherence asks whether it fulfills the requested topic. Platform fit asks whether the format suits ${format}. Originality penalizes copying. copyRisk is low, medium, or high.\n\nBRIEF:\n${brief}\n\nSTYLE PROFILE:\n${styleProfile}\n\nSAMPLES:\n${samples.join("\n---\n")}\n\nDRAFT:\n${draft}`);
        providerRetries += judged.retries;
        evaluation = parseJudge(judged.text);
        judgeMode = judged.label;
      } catch {
        degradedReasons.push("Live semantic evaluation was unavailable; deterministic copy-risk checks were used.");
      }
    }

    if (longestCopy >= 8) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 2), copyRisk: "high" };
    else if (longestCopy >= 6) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 3), copyRisk: "medium" };

    let revisionPerformed = false;
    if (generationMode !== "deterministic fallback" && (evaluation.styleFidelity < 4 || evaluation.briefAdherence < 4 || evaluation.originality < 4 || evaluation.copyRisk === "high")) {
      try {
        const revised = await callGeneration(`Revise the draft once. Preserve the brief, improve the voice match, and remove wording that is too close to the samples. Do not invent facts. Output only the revised ${format}.\n\nVOICE PROFILE:\n${styleProfile}\n\nBRIEF:\n${brief}\n\nCURRENT DRAFT:\n${draft}\n\nEVALUATION NOTES:\n${evaluation.notes}`, 900);
        providerRetries += revised.retries;
        if (revised.text.trim()) {
          draft = revised.text.trim();
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
      retrieved: retrieved.map((item) => ({
        index: item.index,
        score: Number(item.score.toFixed(3)),
        excerpt: item.sample.slice(0, 180) + (item.sample.length > 180 ? "…" : ""),
      })),
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
    return NextResponse.json({ error: "The voice workflow could not complete this request." }, { status: 500 });
  }
}
