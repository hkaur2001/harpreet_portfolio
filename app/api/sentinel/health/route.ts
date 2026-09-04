import { NextResponse } from "next/server";
import { SENTINEL_SCENARIOS } from "@/lib/sentinel/scenarios";
import { TOOL_DEFINITIONS } from "@/lib/sentinel/tool-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    liveModelConfigured: Boolean(process.env.OPENAI_API_KEY),
    modelRouter: ["gpt-5.6-luna", "gpt-5.6-terra"],
    tools: TOOL_DEFINITIONS.length,
    scenarios: SENTINEL_SCENARIOS.length,
    remediationTarget: "simulated infrastructure only",
  });
}
