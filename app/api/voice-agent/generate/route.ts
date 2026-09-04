import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Judge = {
  styleFidelity: number;
  briefAdherence: number;
  platformFit: number;
  originality: number;
  copyRisk: "low" | "medium" | "high";
  notes: string;
};

function responseText(body: unknown) {
  const response = body as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return "";
}

async function callModel(apiKey: string, input: string, maxOutputTokens = 900) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, max_output_tokens: maxOutputTokens, store: false, input }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Model request failed (${response.status}).`);
  return response.json();
}

async function embed(apiKey: string, input: string[]) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Embedding request failed (${response.status}).`);
  const body = await response.json() as { data?: Array<{ embedding?: number[] }> };
  return body.data?.map((item) => item.embedding ?? []) ?? [];
}

function cosine(a: number[], b: number[]) {
  let dot = 0; let a2 = 0; let b2 = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) { dot += a[i] * b[i]; a2 += a[i] * a[i]; b2 += b[i] * b[i]; }
  return dot / (Math.sqrt(a2) * Math.sqrt(b2) || 1);
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
    return { styleFidelity: 3, briefAdherence: 3, platformFit: 3, originality: 3, copyRisk: "low", notes: "Judge output could not be parsed." };
  }
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
    if (!apiKey) return NextResponse.json({ error: "Live model mode is not configured." }, { status: 503 });

    const vectors = await embed(apiKey, [brief, ...samples]);
    if (vectors.length !== samples.length + 1) throw new Error("Embedding response was incomplete.");
    const [query, ...sampleVectors] = vectors;
    const retrieved = samples.map((sample, index) => ({ index, sample, score: cosine(query, sampleVectors[index]) })).sort((a, b) => b.score - a.score).slice(0, Math.min(4, samples.length));

    const profileBody = await callModel(apiKey, `You are analyzing writing style, not the factual topic. Infer a concise reusable voice profile from the samples below. Describe sentence rhythm, level of formality, structure, point of view, rhetorical habits, use of examples, punctuation, calls to action, and what the writer tends to avoid. Do not imitate distinctive phrases. Return one compact paragraph that another writer could use as a style guide.\n\nSAMPLES:\n${samples.map((sample, i) => `[${i + 1}] ${sample}`).join("\n\n")}`, 500);
    const styleProfile = responseText(profileBody).trim();

    const examples = retrieved.map((item) => `[sample-${item.index + 1}] ${item.sample}`).join("\n\n");
    const draftBody = await callModel(apiKey, `Create a ${format} for this brief:\n${brief}\n\nVOICE PROFILE:\n${styleProfile}\n\nRETRIEVED STYLE EXAMPLES:\n${examples}\n\nRules:\n- Match the recurring style patterns, not exact wording.\n- Do not copy a distinctive phrase or any sequence longer than six words from the samples.\n- Stay faithful to the brief.\n- Do not invent facts that are not present in the brief.\n- Output only the draft.`, 900);
    let draft = responseText(draftBody).trim();

    const longestCopy = Math.max(...samples.map((sample) => longestSharedRun(draft, sample)));
    const judgeBody = await callModel(apiKey, `Grade the generated content against the writing samples and brief. Return JSON only with this exact shape: {"styleFidelity":1,"briefAdherence":1,"platformFit":1,"originality":1,"copyRisk":"low","notes":""}. Scores are integers 1-5. Style fidelity asks whether the draft matches recurring tone and structure without parroting. Brief adherence asks whether it actually fulfills the requested topic. Platform fit asks whether the format suits ${format}. Originality penalizes copying. copyRisk is low, medium, or high.\n\nBRIEF:\n${brief}\n\nSTYLE PROFILE:\n${styleProfile}\n\nSAMPLES:\n${samples.join("\n---\n")}\n\nDRAFT:\n${draft}`, 400);
    let evaluation = parseJudge(responseText(judgeBody));
    if (longestCopy >= 8) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 2), copyRisk: "high" };
    else if (longestCopy >= 6) evaluation = { ...evaluation, originality: Math.min(evaluation.originality, 3), copyRisk: "medium" };

    let revisionPerformed = false;
    if (evaluation.styleFidelity < 4 || evaluation.briefAdherence < 4 || evaluation.originality < 4 || evaluation.copyRisk === "high") {
      const revisedBody = await callModel(apiKey, `Revise the draft once. Preserve the brief, improve the voice match, and remove any wording that is too close to the samples. Do not invent facts. Output only the revised ${format}.\n\nVOICE PROFILE:\n${styleProfile}\n\nBRIEF:\n${brief}\n\nCURRENT DRAFT:\n${draft}\n\nEVALUATION NOTES:\n${evaluation.notes}`, 900);
      const revised = responseText(revisedBody).trim();
      if (revised) { draft = revised; revisionPerformed = true; }
    }

    return NextResponse.json({
      draft,
      styleProfile,
      retrieved: retrieved.map((item) => ({ index: item.index, score: Number(item.score.toFixed(3)), excerpt: item.sample.slice(0, 180) + (item.sample.length > 180 ? "…" : "") })),
      evaluation: { ...evaluation, revisionPerformed },
      metrics: { model: "gpt-5.6-luna", retrieval: "text-embedding-3-small + cosine similarity", latencyMs: Date.now() - started, sampleCount: samples.length },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The voice workflow could not complete this request." }, { status: 500 });
  }
}
