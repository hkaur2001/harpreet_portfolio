import { NextResponse } from "next/server";
import { enoughHealth } from "@/lib/enough/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(enoughHealth(), { headers: { "Cache-Control": "no-store" } });
}
