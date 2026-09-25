import { NextResponse } from "next/server";
import { guardPublicJsonPost } from "@/lib/request-security";
import { deskTasks } from "@/lib/atlas/desk-catalog";
import { runDeskAgent } from "@/lib/atlas/desk-agent";
import { aiGatewayConfigured, runDeskGatewayAgent } from "@/lib/atlas/desk-gateway-agent";
import { runDeskHfAgent } from "@/lib/atlas/desk-hf-agent";
import { huggingFaceConfigured } from "@/lib/huggingface-provider";
import type { DeskInput } from "@/lib/atlas/desk-types";
import { UpstreamRequestError } from "@/lib/resilient-fetch";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const blocked = await guardPublicJsonPost(request, "atlas-research", { maxBytes: 16000, requestsPerMinute: 8 });
  if (blocked) return blocked;
  const raw: unknown = await request.json();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ error: "Provide a JSON object." }, { status: 400 });
  const input = raw as DeskInput;
  if (typeof input.task !== "string" || !Object.hasOwn(deskTasks, input.task) || typeof input.question !== "string" || input.question.trim().length < 10 || input.question.length > 2000 || typeof input.reviewerFeedback !== "string" || input.reviewerFeedback.length > 2000 || !Array.isArray(input.approvedRules) || input.approvedRules.length > 6 || input.approvedRules.some(r => typeof r !== "string" || r.length > 1000)) return NextResponse.json({ error: "Choose a task, enter a 10–2,000 character question, and use at most six bounded review rules." }, { status: 400 });
  if (!aiGatewayConfigured() && !process.env.OPENAI_API_KEY && !huggingFaceConfigured()) return NextResponse.json({ error: "The live research agent is not configured. No scripted brief was substituted." }, { status: 503 });
  const started = Date.now();
  const providers: Array<() => Promise<ReturnType<typeof NextResponse.json>>> = [];
  if (aiGatewayConfigured()) providers.push(async () => NextResponse.json(await runDeskGatewayAgent(input, started), { headers: { "Cache-Control": "no-store" } }));
  if (process.env.OPENAI_API_KEY) providers.push(async () => NextResponse.json(await runDeskAgent(input, { apiKey: process.env.OPENAI_API_KEY!, endpoint: `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/responses`, model: process.env.ATLAS_MODEL || "gpt-5.6-luna", startedAt: started, retryRateLimits: false }), { headers: { "Cache-Control": "no-store" } }));
  if (huggingFaceConfigured()) providers.push(async () => NextResponse.json(await runDeskHfAgent(input, started), { headers: { "Cache-Control": "no-store" } }));
  try {
    let lastError: unknown = new Error("NOT_CONFIGURED");
    for (const run of providers) {
      try { return await run(); }
      catch (error) { lastError = error; }
    }
    throw lastError;
  }
  catch (error) {
    const busy = error instanceof UpstreamRequestError && error.status === 429;
    const retrySeconds = busy && error instanceof UpstreamRequestError ? Math.max(10, Math.ceil((error.retryAfterMs ?? 60_000) / 1000)) : 0;
    return NextResponse.json({ error: busy ? `All live model routes are at capacity. Please wait ${retrySeconds} seconds and retry; no scripted brief was substituted.` : "The agent could not produce a complete, source-backed brief within its limits. Retry with a simpler question; no unsupported brief was returned.", code: error instanceof UpstreamRequestError ? `PROVIDER_${error.status}` : error instanceof Error && ["TIME_BUDGET", "TOOL_BUDGET", "EVIDENCE_INCOMPLETE", "BRIEF_INVALID"].includes(error.message) ? error.message : "AGENT_FAILED" }, { status: 502, headers: { "Cache-Control": "no-store", ...(busy ? { "Retry-After": String(retrySeconds) } : {}) } });
  }
}
