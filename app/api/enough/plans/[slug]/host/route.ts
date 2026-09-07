import { NextResponse } from "next/server";
import {
  cancelEnoughPlan,
  EnoughConfigError,
  EnoughForbiddenError,
  EnoughNotFoundError,
} from "@/lib/enough/server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json() as { action?: string; hostSecret?: string };
    if (body.action !== "cancel") return NextResponse.json({ error: "Unsupported host action." }, { status: 400 });
    const view = await cancelEnoughPlan(slug, body.hostSecret ?? "");
    return NextResponse.json({ view }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnoughForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof EnoughNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof EnoughConfigError) return NextResponse.json({ error: error.message, code: "PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
    console.error("Enough host action failed", error);
    return NextResponse.json({ error: "Unable to update this plan right now." }, { status: 500 });
  }
}
