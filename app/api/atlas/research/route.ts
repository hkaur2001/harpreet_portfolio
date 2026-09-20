import { NextResponse } from "next/server";
import { guardPublicJsonPost } from "@/lib/request-security";
import { deskTasks } from "@/lib/atlas/desk-catalog";
import { runDeskAgent } from "@/lib/atlas/desk-agent";
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
  if (!process.env.OPENAI_API_KEY && !huggingFaceConfigured()) return NextResponse.json({ error: "The live research agent is not configured. No scripted brief was substituted." }, { status: 503 });
  try {
    try {
      if (process.env.OPENAI_API_KEY) return NextResponse.json(await runDeskAgent(input), { headers: { "Cache-Control": "no-store" } });
      return NextResponse.json(await runDeskHfAgent(input, Date.now()), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (!(error instanceof UpstreamRequestError && [402, 429, 500, 502, 503].includes(error.status) && huggingFaceConfigured())) throw error;
      return NextResponse.json(await runDeskHfAgent(input, Date.now()), { headers: { "Cache-Control": "no-store" } });
    }
  }
  catch (error) {
    const busy = error instanceof UpstreamRequestError && error.status === 429;
    return NextResponse.json({ error: busy ? "The model provider is busy. Wait 10 seconds and retry; no scripted brief was substituted." : "The agent could not produce a complete, source-backed brief within its limits. Retry with a simpler question; no unsupported brief was returned.", code: error instanceof UpstreamRequestError ? `PROVIDER_${error.status}` : error instanceof Error && ["TIME_BUDGET", "TOOL_BUDGET", "EVIDENCE_INCOMPLETE", "BRIEF_INVALID"].includes(error.message) ? error.message : "AGENT_FAILED" }, { status: 502, headers: { "Cache-Control": "no-store", ...(busy ? { "Retry-After": "10" } : {}) } });
  }
}
