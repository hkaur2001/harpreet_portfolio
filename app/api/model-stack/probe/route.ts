import { NextRequest, NextResponse } from "next/server";
import { HUGGING_FACE_MODELS, huggingFaceChat, huggingFaceConfigured } from "@/lib/huggingface-provider";

export const runtime = "nodejs";
export const maxDuration = 60;

type ProbeResult = {
  ok: boolean;
  model: string;
  latencyMs: number;
  error?: string;
};

async function probeModel(model: string, purpose: "generation" | "challenger" | "judge"): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const result = await huggingFaceChat(
      purpose === "judge"
        ? 'Return only this JSON: {"status":"ok"}'
        : "Reply with exactly: provider-ok",
      {
        purpose,
        model,
        maxTokens: 96,
        temperature: 0,
      },
    );

    return {
      ok: result.text.trim().length > 0,
      model: result.model,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      model,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message.slice(0, 180) : "Provider probe failed.",
    };
  }
}

export async function GET(request: NextRequest) {
  const deployedCommit = process.env.VERCEL_GIT_COMMIT_SHA;
  const requestedCommit = request.nextUrl.searchParams.get("commit");

  // This endpoint is only for deployment validation. Requiring the exact deployed
  // revision prevents generic health-check traffic from invoking paid model calls.
  if (!deployedCommit || requestedCommit !== deployedCommit) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!huggingFaceConfigured()) {
    return NextResponse.json({
      allPassed: false,
      huggingFaceConfigured: false,
      probes: [],
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const probes: ProbeResult[] = [];
  probes.push(await probeModel(HUGGING_FACE_MODELS.generation, "generation"));
  probes.push(await probeModel(HUGGING_FACE_MODELS.challenger, "challenger"));
  probes.push(await probeModel(HUGGING_FACE_MODELS.judge, "judge"));

  return NextResponse.json({
    allPassed: probes.every((probe) => probe.ok),
    huggingFaceConfigured: true,
    deploymentCommit: deployedCommit,
    probes,
  }, { headers: { "Cache-Control": "no-store" } });
}
