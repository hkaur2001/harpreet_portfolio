import { NextResponse } from "next/server";
import { runAtlasAgent, type AtlasInput } from "@/lib/atlas/agent";
import { verticals } from "@/lib/atlas/scenarios";
import { guardPublicJsonPost } from "@/lib/request-security";
import { UpstreamRequestError } from "@/lib/resilient-fetch";
import { aiGatewayConfigured } from "@/lib/atlas/desk-gateway-agent";

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
  if (!process.env.OPENAI_API_KEY && !aiGatewayConfigured()) return NextResponse.json({ error: "Atlas's live agent is not configured. No simulated recommendation was substituted." }, { status: 503 });
  try {
    const started = Date.now();
    let lastError: unknown;
    const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (gatewayKey) {
      try {
        return NextResponse.json(await runAtlasAgent(input, {
          apiKey: gatewayKey,
          endpoint: `${(process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/$/, "")}/responses`,
          model: process.env.ATLAS_GATEWAY_MODEL || "openai/gpt-5.6-sol",
          displayModel: "Vercel AI Gateway",
          startedAt: started,
          budgetMs: process.env.OPENAI_API_KEY ? 28_000 : 55_000,
          retryRateLimits: false,
        }), { headers: { "Cache-Control": "no-store" } });
      } catch (error) { lastError = error; }
    }
    if (process.env.OPENAI_API_KEY && Date.now() - started < 45_000) {
      try { return NextResponse.json(await runAtlasAgent(input, { apiKey: process.env.OPENAI_API_KEY, endpoint: `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/responses`, model: process.env.ATLAS_MODEL || "gpt-5.6-luna", startedAt: started, retryRateLimits: false }), { headers: { "Cache-Control": "no-store" } }); }
      catch (error) { lastError = error; }
    }
    throw lastError ?? new Error("Agent reached its time budget.");
  } catch (error) {
    const diagnostics = new Map([
      ["Agent did not gather comparison evidence.", "COMPARISON_INCOMPLETE"],
      ["Recommendation did not pass its evidence and control boundary.", "CONTROL_EVIDENCE_INCOMPLETE"],
      ["Agent reached its time budget.", "TIME_BUDGET"],
      ["Agent cited unverified evidence.", "CITATION_INVALID"],
      ["Invalid rollout phases.", "PHASES_INVALID"],
      ["Invalid agent result.", "PLAN_INVALID"],
      ["Agent omitted required deployment uncertainty.", "UNCERTAINTY_MISSING"],
    ]);
    const code = error instanceof UpstreamRequestError ? `PROVIDER_${error.status}` : error instanceof Error ? diagnostics.get(error.message) ?? (error.name === "TimeoutError" ? "PROVIDER_TIMEOUT" : error instanceof SyntaxError ? "PLAN_PARSE_FAILED" : "AGENT_FAILED") : "AGENT_FAILED";
    if (code === "PROVIDER_429") return NextResponse.json({ error: "The model provider is busy. Please wait 10 seconds and retry. Your brief has not been saved, and no simulated plan was substituted.", code }, { status: 502, headers: { "Cache-Control": "no-store", "Retry-After": "10" } });
    return NextResponse.json({ error: "The agent could not complete an evidence-backed plan within its limits. Please retry or simplify the brief. No unsupported recommendation was returned.", code }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
