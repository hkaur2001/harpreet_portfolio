import "server-only";
import { runDeskAgent } from "./desk-agent";
import type { DeskInput, DeskResult } from "./desk-types";

function gatewayToken() {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
}

export function aiGatewayConfigured() {
  return Boolean(gatewayToken());
}

export function runDeskGatewayAgent(input: DeskInput, startedAt: number): Promise<DeskResult> {
  const apiKey = gatewayToken();
  if (!apiKey) throw new Error("NOT_CONFIGURED");
  const base = (process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/$/, "");
  const model = process.env.ATLAS_GATEWAY_MODEL || "openai/gpt-5.6-sol";
  return runDeskAgent(input, {
    apiKey,
    endpoint: `${base}/responses`,
    model,
    displayModel: `${model} · Vercel AI Gateway`,
    startedAt,
    budgetMs: process.env.OPENAI_API_KEY ? 28_000 : 55_000,
    retryRateLimits: false,
  });
}
