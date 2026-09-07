import { EnoughConfigError, EnoughNotFoundError, getEnoughPlan } from "@/lib/enough/server";

export const runtime = "nodejs";

function icsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const plan = await getEnoughPlan(slug);
    if (plan.status !== "confirmed") return new Response("This plan is not confirmed yet.", { status: 409 });
    const start = new Date(plan.startsAt);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Enough//Plans that unlock//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${plan.slug}@enough`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(start.toISOString())}`,
      `DTEND:${icsDate(end.toISOString())}`,
      `SUMMARY:${escapeIcs(`${plan.emoji} ${plan.title}`)}`,
      `DESCRIPTION:${escapeIcs(plan.description || "Confirmed through Enough.")}`,
      plan.location ? `LOCATION:${escapeIcs(plan.location)}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="enough-${plan.slug}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof EnoughNotFoundError) return new Response("Plan not found.", { status: 404 });
    if (error instanceof EnoughConfigError) return new Response("Collaboration storage is not configured.", { status: 503 });
    return new Response("Unable to build calendar event.", { status: 500 });
  }
}
