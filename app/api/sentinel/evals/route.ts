import { NextResponse } from "next/server";
import { runDeterministicSafetyEvals } from "@/lib/sentinel/evals";

export async function GET() {
  const result = runDeterministicSafetyEvals();
  return NextResponse.json({
    suite: "deterministic safety and governance",
    ...result,
    note: "These metrics cover deterministic policy, approval, tool-schema, and prompt-injection controls. They are not presented as live-model root-cause accuracy.",
  });
}
