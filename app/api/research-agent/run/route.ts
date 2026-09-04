import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Source = { title: string; url: string; sourceType: string };

type Judge = { relevance: number; synthesis: number; actionability: number; sourceDiversity: number; citationCoverage: number; notes: string };

function responseText(body: unknown) {
  const response = body as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  for (const item of response.output ?? []) for (const content of item.content ?? []) if (content.type === "output_text" && content.text) return content.text;
  return "";
}

function sourceType(url: string) {
  if (/reddit\.com/i.test(url)) return "Reddit";
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  if (/substack\.com|beehiiv\.com|buttondown\.email|convertkit\.com/i.test(url)) return "Newsletter";
  if (/openai\.com|anthropic\.com|microsoft\.com|google\.com|github\.com|arxiv\.org/i.test(url)) return "Primary/technical";
  return "Web";
}

function extractSources(body: unknown): Source[] {
  const response = body as { output?: Array<{ type?: string; action?: { sources?: Array<{ title?: string; url?: string }> }; content?: Array<{ annotations?: Array<{ type?: string; title?: string; url?: string }> }> }> };
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
  const response = await fetch("https://api.openai.com/v1/responses", {
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
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Research request failed (${response.status}).`);
  return response.json();
}

function clamp(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, Math.round(n))) : 3;
}

async function judge(apiKey: string, goal: string, digest: string, sources: Source[]): Promise<Judge> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      store: false,
      max_output_tokens: 350,
      input: `Evaluate a research digest for the user's professional goal. Return JSON only: {"relevance":1,"synthesis":1,"actionability":1,"sourceDiversity":1,"citationCoverage":1,"notes":""}. All scores are integers 1-5. Relevance: every major item helps the goal. Synthesis: it connects evidence instead of listing links. Actionability: it gives concrete next steps/talking points. Source diversity: multiple independent source types are represented, without rewarding low-quality sources. Citation coverage: factual claims are traceable to the supplied source set.\n\nGOAL:\n${goal}\n\nDIGEST:\n${digest}\n\nSOURCES:\n${sources.map((source) => `${source.sourceType}: ${source.title} — ${source.url}`).join("\n")}`,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Judge request failed (${response.status}).`);
  const body = await response.json();
  const text = responseText(body);
  try {
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Partial<Judge>;
    return { relevance: clamp(parsed.relevance), synthesis: clamp(parsed.synthesis), actionability: clamp(parsed.actionability), sourceDiversity: clamp(parsed.sourceDiversity), citationCoverage: clamp(parsed.citationCoverage), notes: typeof parsed.notes === "string" ? parsed.notes : "" };
  } catch {
    return { relevance: 3, synthesis: 3, actionability: 3, sourceDiversity: 3, citationCoverage: 3, notes: "Judge output could not be parsed." };
  }
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
    if (!apiKey) return NextResponse.json({ error: "Live model mode is not configured." }, { status: 503 });

    const body = await research(apiKey, goal, topics);
    const digest = responseText(body).trim();
    if (!digest) throw new Error("The research model returned no digest.");
    const sources = extractSources(body);
    const evaluation = await judge(apiKey, goal, digest, sources);
    const types = [...new Set(sources.map((source) => source.sourceType))];
    const requested = ["Reddit", "Newsletter", "LinkedIn", "Primary/technical"];
    const coverage = requested.map((type) => types.includes(type) ? `${type}: found` : `${type}: not found/indexable`);

    return NextResponse.json({
      digest,
      sources,
      evaluation,
      coverage,
      metrics: { model: "gpt-5.6-terra", searchTool: "OpenAI web search", latencyMs: Date.now() - started, sourceCount: sources.length },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Research could not complete." }, { status: 500 });
  }
}
