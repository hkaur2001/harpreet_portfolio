import { NextResponse } from "next/server";
import { createEnoughPlan, EnoughConfigError, EnoughValidationError } from "@/lib/enough/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createEnoughPlan(body);
    return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnoughValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof EnoughConfigError) return NextResponse.json({ error: error.message, code: "PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
    console.error("Enough create plan failed", error);
    return NextResponse.json({ error: "Unable to create this plan right now." }, { status: 500 });
  }
}
