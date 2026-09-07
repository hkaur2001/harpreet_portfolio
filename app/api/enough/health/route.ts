import { NextResponse } from "next/server";
import { enoughHealth } from "@/lib/enough/server";

export const runtime = "nodejs";

export async function GET() {
  const health = enoughHealth();
  return NextResponse.json(
    {
      ...health,
      privacyModel: `${health.privacyModel}; blind quorum remains the confirmation boundary`,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
