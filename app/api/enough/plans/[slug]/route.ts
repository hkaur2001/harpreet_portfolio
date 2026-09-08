import { NextResponse } from "next/server";
import { EnoughConfigError, EnoughNotFoundError, getEnoughPlan } from "@/lib/enough/rpc-server";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const token = new URL(request.url).searchParams.get("participantToken");
    const view = await getEnoughPlan(slug, token);
    return NextResponse.json(view, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnoughNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof EnoughConfigError) return NextResponse.json({ error: error.message, code: "PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
    console.error("Enough read plan failed", error);
    return NextResponse.json({ error: "Unable to load this plan right now." }, { status: 500 });
  }
}
