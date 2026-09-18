import { NextResponse } from "next/server";
import { readDeskSource } from "@/lib/atlas/desk-evidence";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const source = readDeskSource(id);
  return source ? NextResponse.json(source, { headers: { "Cache-Control": "public, max-age=3600" } }) : NextResponse.json({ error: "Source not available." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
