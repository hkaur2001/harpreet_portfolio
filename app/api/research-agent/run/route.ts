import { NextRequest, NextResponse } from "next/server";
import { fetchJsonWithRetry, openAiUrl } from "@/lib/resilient-fetch";
import { huggingFaceChat, huggingFaceConfigured } from "@/lib/huggingface-provider";

export const runtime = "nodejs";
export const maxDuration = 60;

type Source = { title: string; url: string; sourceType: string };
type Judge = { relevance: number; synthesis: number; actionability: number; sourceDiversity: number; citationCoverage: number; notes: string };
type ResponseBody = { output?: Array<{ type?: string; action?: { sources?: Array<{ title?: string; url?: string }> }; content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; title?: string; url?: string }> }> }> };

function responseText(body: unknown) {
  const response = body as ResponseBody;
  for (const item of response.output ?? []) for (const content of item.content ?? []) if (content.type === "output_text" && content.text) return content.text;
  return "";
}

function sourceType(url: string) {
  if (/reddit\.com/i.test(url)) return "Reddit";
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  if (/substack\.com|beehiiv\.com|buttondown\.email|convertkit\.com/i.test(url)) return "Newsletter";
  if (/openai\.com|anthropic\.com|microsoft\.com|google\.com|github\.com|arxiv\.org|huggingface\.co/i.test(url)) return "Primary/technical";
  return "Web";
}

function extractSources(body: unknown): Source[] {
  const response = body as ResponseBody;
  const all: Source[] = [];
  for (const item of response.output ?? []) {
    for (const source of item.action?.sources ?? []) if (source.url) all.push({ title: source.title ?? source.url, url: source.url, sourceType: sourceType(source.url) });
    for (const content of item.content ?? []) for (const annotation of content.annotations ?? []) if (annotation.url) all.push({ title: annotation.title ?? annotation.url, url: annotation.url, sourceType: sourceType(annotation.url) });
  }
  const map = new Map<string, Source>();
  all.forEach((source) => map.set(source.url, source));
  return [...map.values()].slice(0, 18);
}

async function research(apiKey: string, goal: string, topics: string) {
  return fetchJsonWithRetry<ResponseBody>(openAiUrl("responses"), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      reasoning: { effort: "medium" },
      store: false,
      max_output_tokens: 1500,
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      input: `Act as a research agent for one professional goal. Search the public web, prioritizing material from the last 7 days when possible. Deliberately look for multiple source types: Reddit discussions, newsletter/blog analysis, public LinkedIn posts when indexable, and primary technical sources. If a source type is inaccessible or has no useful result, say so rather than inventing coverage. Resolve contradictions and prefer original/primary sources for factual claims.\n\nProfessional goal:\n${goal}\n\nTopics:\n${topics}\n\nCreate a concise weekly-style brief with these sections: 1) Three signals worth knowing, 2) Why each matters specifically for the goal, 3) One practical action or interview talking point per signal, 4) Source coverage note. Cite web-derived claims with the citations produced by the web-search tool. Do not include generic AI news that is not useful for the stated goal.`,
    }),
  }, { attempts: 3, baseDelayMs: 350, maxDelayMs: 1800, timeoutMs: 45_000 });
}

function clamp(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, Math.round(n))) : 3;
}

function deterministicJudge(digest: string, sources: Source[]): Judge {
  const sourceTypes = new Set(sources.map((source) => source.sourceType));
  const citationCoverage = sources.length > 0 ? 4 : 1;
  return {
    relevance: digest.length > 200 ? 3 : 1,
    synthesis: digest.length > 500 ? 3 : 2,
    actionability: /action|talking point|next step|practice|try/i.test(digest) ? 3 : 2,
    sourceDiversity: Math.max(1, Math.min(5, sourceTypes.size)),
    citationCoverage,
    notes: "The semantic judge was unavailable; these fallback scores use only observable structure and source metadata.",
  };
}

function judgePrompt(goal: string, digest: string, sources: Source[]) {
  return `Evaluate a research digest for the user's professional goal. Return JSON only: {"relevance":1,"synthesis":1,"actionability":1,"sourceDiversity":1,"citationCoverage":1,"notes":""}. All scores are integers 1-5. Relevance: every major item helps the goal. Synthesis: it connects evidence instead of listing links. Actionability: it gives concrete next steps/talking points. Source diversity: multiple independent source types are represented, without rewarding low-quality sources. Citation coverage: factual claims are traceable to the supplied source set.\n\nGOAL:\n${goal}\n\nDIGEST:\n${digest}\n\nSOURCES:\n${sources.map((source) => `${source.sourceType}: ${source.title} — ${source.url}`).join("\n")}`;
}

async function openAiJudge(apiKey: string, prompt: string) {
  return fetchJsonWithRetry<ResponseBody>(openAiUrl("responses"), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      store: false,
      max_output_tokens: 350,
      input: prompt,
    }),
  }, { attempts: 3, baseDelayMs: 250, maxDelayMs: 1400, timeoutMs: 20_000 });
}

function parseJudgeText(text: string): Judge {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object found.");
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<Judge>;
    return { relevance: clamp(parsed.relevance), synthesis: clamp(parsed.synthesis), actionability: clamp(parsed.actionability), sourceDiversity: clamp(parsed.sourceDiversity), citationCoverage: clamp(parsed.citationCoverage), notes: typeof parsed.notes === "string" ? parsed.notes : "" };
  } catch {
    return { relevance: 3, synthesis: 3, actionability: 3, sourceDiversity: 3, citationCoverage: 3, notes: "Judge output could not be parsed." };
  }
}

function degradedDigest(goal: string, topics: string) {
  return `Live research is temporarily unavailable, so this run stopped rather than inventing fresh sources.\n\nGoal\n${goal}\n\nTopics requested\n${topics}\n\nWhat the production workflow would do\n1. Search several public source types independently.\n2. Deduplicate repeated stories and rank evidence against the stated goal.\n3. Prefer primary technical sources for factual claims.\n4. Explain contradictions instead of averaging them away.\n5. Return a cited digest only when source provenance is available.\n\nNo current-web claims are shown in degraded mode.`;
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const { goal: rawGoal, topics: rawTopics } = await request.json() as { goal?: string; topics?: string };
    const goal = (rawGoal ?? "").trim();
    const topics = (rawTopics ?? "").trim();
    if (goal.length < 20 || goal.length > 1500) return NextResponse.json({ error: "The professional goal must be between 20 and 1,500 characters." }, { status: 400 });
    if (topics.length < 3 || topics.length > 700) return NextResponse.json({ error: "Topics must be between 3 and 700 characters." }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    let providerRetries = 0;
    let degraded = false;
    const degradedReasons: string[] = [];
    let digest = degradedDigest(goal, topics);
    let sources: Source[] = [];
    let model = "degraded fallback";
    let searchTool = "not called";

    if (apiKey) {
      try {
        const result = await research(apiKey, goal, topics);
        providerRetries += result.retries;
        const liveDigest = responseText(result.data).trim();
        if (liveDigest) {
          digest = liveDigest;
          sources = extractSources(result.data);
          model = "gpt-5.6-terra";
          searchTool = "OpenAI web search";
        } else {
          degraded = true;
          degradedReasons.push("The research provider returned no usable digest, so the system refused to invent current-web claims.");
        }
      } catch {
        degraded = true;
        degradedReasons.push("The live research provider was rate-limited or unavailable after retries. The request completed in a no-fabrication fallback mode.");
      }
    } else {
      degraded = true;
      degradedReasons.push("Live model configuration is unavailable. No current-web claims were generated.");
    }

    let evaluation = deterministicJudge(digest, sources);
    let judgeMode = "deterministic fallback";
    if (model === "gpt-5.6-terra") {
      const prompt = judgePrompt(goal, digest, sources);
      if (huggingFaceConfigured()) {
        try {
          const judged = await huggingFaceChat(prompt, { purpose: "judge", maxTokens: 420, temperature: 0 });
          providerRetries += judged.retries;
          evaluation = parseJudgeText(judged.text);
          judgeMode = `${judged.model} · Hugging Face`;
        } catch {
          degradedReasons.push("The independent Hugging Face evaluator was unavailable; the workflow tried the primary provider judge instead.");
        }
      }

      if (judgeMode === "deterministic fallback" && apiKey) {
        try {
          const judged = await openAiJudge(apiKey, prompt);
          providerRetries += judged.retries;
          evaluation = parseJudgeText(responseText(judged.data));
          judgeMode = "gpt-5.6-luna · OpenAI";
        } catch {
          degraded = true;
          degradedReasons.push("The semantic evaluator was unavailable; observable source/structure checks were used instead.");
        }
      }
    }

    const types = [...new Set(sources.map((source) => source.sourceType))];
    const requested = ["Reddit", "Newsletter", "LinkedIn", "Primary/technical"];
    const coverage = requested.map((type) => types.includes(type) ? `${type}: found` : `${type}: not found/indexable`);

    return NextResponse.json({
      digest,
      sources,
      evaluation,
      coverage,
      metrics: { model, searchTool, judge: judgeMode, providerRetries, degraded, degradedReasons, latencyMs: Date.now() - started, sourceCount: sources.length },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The request could not be parsed or validated." }, { status: 400 });
  }
}
