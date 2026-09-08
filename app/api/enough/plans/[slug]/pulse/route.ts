import { NextResponse } from "next/server";
import {
  EnoughConfigError,
  EnoughForbiddenError,
  EnoughNotFoundError,
  EnoughValidationError,
  updateEnoughPulse,
} from "@/lib/enough/rpc-server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const view = await updateEnoughPulse(slug, body);
    return NextResponse.json({ view }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnoughValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof EnoughForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof EnoughNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof EnoughConfigError) return NextResponse.json({ error: error.message, code: "PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
    console.error("Enough pulse failed", error);
    return NextResponse.json({ error: "Unable to update your day-of status right now." }, { status: 500 });
  }
}
