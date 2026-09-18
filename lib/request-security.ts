import { NextResponse } from "next/server";

type RateEntry = { count: number; resetAt: number };
type GuardOptions = { maxBytes: number; requestsPerMinute?: number };

const globalRateStore = globalThis as typeof globalThis & { __portfolioRateLimits?: Map<string, RateEntry> };
const rateLimits = globalRateStore.__portfolioRateLimits ?? new Map<string, RateEntry>();
globalRateStore.__portfolioRateLimits = rateLimits;

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "anonymous";
}

export async function guardPublicJsonPost(request: Request, scope: string, options: GuardOptions) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.split(";")[0].trim() !== "application/json") {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > options.maxBytes) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  try {
    const reader = request.clone().body?.getReader();
    if (!reader) return NextResponse.json({ error: "Request body is required." }, { status: 400 });
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > options.maxBytes) {
        void reader.cancel();
        return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const now = Date.now();
  const key = `${scope}:${clientAddress(request)}`;
  const limit = options.requestsPerMinute ?? 60;
  const current = rateLimits.get(key);
  const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
  entry.count += 1;
  rateLimits.set(key, entry);

  if (rateLimits.size > 5_000) {
    for (const [storedKey, stored] of rateLimits) {
      if (stored.resetAt <= now) rateLimits.delete(storedKey);
    }
    while (rateLimits.size > 5_000) {
      const oldestKey = rateLimits.keys().next().value;
      if (oldestKey === undefined) break;
      rateLimits.delete(oldestKey);
    }
  }

  if (entry.count > limit) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((entry.resetAt - now) / 1_000))), "Cache-Control": "no-store" } },
    );
  }

  return null;
}
