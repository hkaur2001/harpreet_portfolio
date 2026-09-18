import { NextResponse } from "next/server";
import { runAtlasAgent, type AtlasInput } from "@/lib/atlas/agent";
import { verticals } from "@/lib/atlas/scenarios";
import { guardPublicJsonPost } from "@/lib/request-security";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = await guardPublicJsonPost(request, "atlas-plan", { maxBytes: 8_000, requestsPerMinute: 12 });
  if (blocked) return blocked;
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Enter a valid workflow brief." }, { status: 400 }); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ error: "Request must be a JSON object." }, { status: 400 });
  const input = raw as AtlasInput;
  if (typeof input.verticalId !== "string" || !Object.hasOwn(verticals, input.verticalId) || typeof input.brief !== "string" || input.brief.trim().length < 40 || input.brief.length > 4_000 || typeof input.riskTolerance !== "number" || !Number.isFinite(input.riskTolerance) || input.riskTolerance < 0 || input.riskTolerance > 100 || !Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 16 || typeof input.strictGovernance !== "boolean") return NextResponse.json({ error: "Choose an industry and describe the workflow in 40–4,000 characters. Check the deployment constraints." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Atlas's live agent is not configured. No simulated recommendation was substituted." }, { status: 503 });
  try {
    return NextResponse.json(await runAtlasAgent(input), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The agent could not complete an evidence-backed plan within its limits. Please retry or simplify the brief. No unsupported recommendation was returned." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
