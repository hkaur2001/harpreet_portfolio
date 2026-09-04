import { NextRequest, NextResponse } from "next/server";
import { investigateDeterministically, investigateWithOpenAI } from "@/lib/sentinel/agent";
import { allowLiveInvestigation } from "@/lib/sentinel/rate-limit";
import { getScenario } from "@/lib/sentinel/scenarios";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let payload: { scenarioId?: string; mode?: "live" | "deterministic" };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const scenario = payload.scenarioId ? getScenario(payload.scenarioId) : undefined;
  if (!scenario) return NextResponse.json({ error: "Unknown Sentinel scenario." }, { status: 404 });

  const requestedLive = payload.mode !== "deterministic";
  if (!requestedLive || !process.env.OPENAI_API_KEY) {
    const result = await investigateDeterministically(scenario);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || request.headers.get("x-real-ip") || "anonymous";
  const rate = allowLiveInvestigation(clientKey);
  if (!rate.allowed) {
    const result = await investigateDeterministically(scenario);
    return NextResponse.json({ ...result, rateLimited: true }, { headers: { "Cache-Control": "no-store", "X-Sentinel-Live-Remaining": "0" } });
  }

  const result = await investigateWithOpenAI(scenario);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
      "X-Sentinel-Live-Remaining": String(rate.remaining),
    },
  });
}
