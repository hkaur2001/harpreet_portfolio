import { NextResponse } from "next/server";
import {
  EnoughConfigError,
  EnoughNotFoundError,
  EnoughValidationError,
  respondToEnoughPlan,
} from "@/lib/enough/server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const result = await respondToEnoughPlan(slug, body);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnoughValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof EnoughNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof EnoughConfigError) return NextResponse.json({ error: error.message, code: "PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
    console.error("Enough RSVP failed", error);
    return NextResponse.json({ error: "Unable to save your response right now." }, { status: 500 });
  }
}
