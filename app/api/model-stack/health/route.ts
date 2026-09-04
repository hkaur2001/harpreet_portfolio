import { NextResponse } from "next/server";
import { HUGGING_FACE_MODELS } from "@/lib/huggingface-provider";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
    huggingFaceConfigured: Boolean(process.env.HF_TOKEN),
    localEmbeddings: {
      runtime: "Hugging Face Transformers.js",
      model: "Xenova/bge-small-en-v1.5",
      execution: "browser-local",
      remoteEmbeddingApiRequired: false,
    },
    hostedOpenModels: {
      primaryGeneration: HUGGING_FACE_MODELS.generation,
      generationChallenger: HUGGING_FACE_MODELS.challenger,
      independentEvaluation: HUGGING_FACE_MODELS.judge,
      routing: "Hugging Face Inference Providers with fastest-provider selection",
      activation: "Set HF_TOKEN in the server environment",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
