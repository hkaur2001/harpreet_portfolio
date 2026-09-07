import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type EnoughStatus = "open" | "confirmed" | "expired" | "cancelled";
export type EnoughResponse = "yes" | "no";

export type EnoughPlanView = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  location: string;
  startsAt: string;
  deadlineAt: string;
  threshold: number;
  status: EnoughStatus;
  yesCount: number;
  remaining: number;
  hostName: string;
  hostPledged: boolean | null;
  guestList: Array<{ name: string; isHost: boolean }> | null;
  viewerResponse: EnoughResponse | null;
  createdAt: string;
};

type PlanRow = {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  description: string;
  location: string;
  starts_at: string;
  deadline_at: string;
  threshold: number;
  status: EnoughStatus;
  host_name: string;
  host_secret_hash: string;
  host_pledged: boolean;
  created_at: string;
  confirmed_at: string | null;
};

type ResponseRow = {
  display_name: string;
  response: EnoughResponse;
  participant_key_hash: string;
  is_host: boolean;
  email: string | null;
};

export class EnoughConfigError extends Error {}
export class EnoughValidationError extends Error {}
export class EnoughNotFoundError extends Error {}
export class EnoughForbiddenError extends Error {}

export function enoughConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function enoughEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new EnoughConfigError("Persistent collaboration is not configured yet.");
  return { url, key };
}

function dbHeaders(prefer?: string) {
  const { key } = config();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function dbFetch(path: string, init: RequestInit = {}) {
  const { url } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { ...dbHeaders(), ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`Enough database request failed (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function makeClientToken() {
  return randomBytes(24).toString("base64url");
}

function makeSlug() {
  return randomBytes(7).toString("base64url").toLowerCase();
}

function cleanText(value: unknown, max: number, label: string, min = 1) {
  if (typeof value !== "string") throw new EnoughValidationError(`${label} is required.`);
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (cleaned.length < min || cleaned.length > max) throw new EnoughValidationError(`${label} must be between ${min} and ${max} characters.`);
  return cleaned;
}

function optionalText(value: unknown, max: number) {
  if (value == null || value === "") return "";
  if (typeof value !== "string") throw new EnoughValidationError("Invalid text field.");
  return value.trim().slice(0, max);
}

function validEmail(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new EnoughValidationError("Email is invalid.");
  const email = value.trim().toLowerCase();
  if (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new EnoughValidationError("Email is invalid.");
  return email;
}

function dateValue(value: unknown, label: string) {
  if (typeof value !== "string") throw new EnoughValidationError(`${label} is required.`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new EnoughValidationError(`${label} is invalid.`);
  return date;
}

export function validateCreatePayload(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new EnoughValidationError("Invalid request body.");
  const body = raw as Record<string, unknown>;
  const title = cleanText(body.title, 90, "Plan title", 3);
  const emoji = typeof body.emoji === "string" && body.emoji.trim() ? body.emoji.trim().slice(0, 8) : "✨";
  const description = optionalText(body.description, 400);
  const location = optionalText(body.location, 160);
  const hostName = cleanText(body.hostName, 60, "Your name", 1);
  const hostEmail = validEmail(body.hostEmail);
  const startsAt = dateValue(body.startsAt, "Start time");
  const deadlineAt = dateValue(body.deadlineAt, "RSVP deadline");
  const threshold = Number(body.threshold);
  const hostPledged = body.hostPledged !== false;

  if (!Number.isInteger(threshold) || threshold < 2 || threshold > 30) throw new EnoughValidationError("Threshold must be between 2 and 30 people.");
  if (deadlineAt.getTime() <= Date.now()) throw new EnoughValidationError("RSVP deadline must be in the future.");
  if (startsAt.getTime() <= deadlineAt.getTime()) throw new EnoughValidationError("The plan must start after the RSVP deadline.");
  if (startsAt.getTime() > Date.now() + 1000 * 60 * 60 * 24 * 60) throw new EnoughValidationError("Enough is designed for plans within the next 60 days.");

  return { title, emoji, description, location, hostName, hostEmail, startsAt: startsAt.toISOString(), deadlineAt: deadlineAt.toISOString(), threshold, hostPledged };
}

export function validateRsvpPayload(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new EnoughValidationError("Invalid request body.");
  const body = raw as Record<string, unknown>;
  const name = cleanText(body.name, 60, "Your name", 1);
  const email = validEmail(body.email);
  const response = body.response === "yes" || body.response === "no" ? body.response : null;
  const participantToken = typeof body.participantToken === "string" && body.participantToken.length >= 16 ? body.participantToken : null;
  if (!response) throw new EnoughValidationError("Choose whether you are in or out.");
  if (!participantToken) throw new EnoughValidationError("Participant token is missing.");
  return { name, email, response, participantToken } as const;
}

async function expireIfNeeded(plan: PlanRow) {
  if (plan.status === "open" && new Date(plan.deadline_at).getTime() <= Date.now()) {
    await dbFetch(`enough_plans?id=eq.${encodeURIComponent(plan.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "expired" }),
    });
    return { ...plan, status: "expired" as EnoughStatus };
  }
  return plan;
}

async function planBySlug(slug: string) {
  const body = await dbFetch(`enough_plans?slug=eq.${encodeURIComponent(slug)}&select=*`);
  const rows = Array.isArray(body) ? body as PlanRow[] : [];
  if (!rows[0]) throw new EnoughNotFoundError("Plan not found.");
  return expireIfNeeded(rows[0]);
}

async function responsesForPlan(planId: string) {
  const body = await dbFetch(`enough_responses?plan_id=eq.${encodeURIComponent(planId)}&select=display_name,response,participant_key_hash,is_host,email&order=created_at.asc`);
  return Array.isArray(body) ? body as ResponseRow[] : [];
}

async function toView(plan: PlanRow, participantToken?: string | null): Promise<EnoughPlanView> {
  const responses = await responsesForPlan(plan.id);
  const yes = responses.filter((item) => item.response === "yes");
  const viewerHash = participantToken ? hash(participantToken) : null;
  const viewer = viewerHash ? responses.find((item) => safeEqual(item.participant_key_hash, viewerHash)) : undefined;
  const revealed = plan.status === "confirmed";
  return {
    slug: plan.slug,
    title: plan.title,
    emoji: plan.emoji,
    description: plan.description,
    location: plan.location,
    startsAt: plan.starts_at,
    deadlineAt: plan.deadline_at,
    threshold: plan.threshold,
    status: plan.status,
    yesCount: yes.length,
    remaining: Math.max(0, plan.threshold - yes.length),
    hostName: plan.host_name,
    hostPledged: revealed ? plan.host_pledged : null,
    guestList: revealed ? yes.map((item) => ({ name: item.display_name, isHost: item.is_host })) : null,
    viewerResponse: viewer?.response ?? null,
    createdAt: plan.created_at,
  };
}

export async function createEnoughPlan(raw: unknown) {
  const input = validateCreatePayload(raw);
  const hostSecret = makeClientToken();
  const slug = makeSlug();
  const rows = await dbFetch("enough_plans", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug,
      title: input.title,
      emoji: input.emoji,
      description: input.description,
      location: input.location,
      starts_at: input.startsAt,
      deadline_at: input.deadlineAt,
      threshold: input.threshold,
      status: "open",
      host_name: input.hostName,
      host_secret_hash: hash(hostSecret),
      host_pledged: input.hostPledged,
    }),
  });
  const plan = Array.isArray(rows) ? rows[0] as PlanRow : null;
  if (!plan) throw new Error("Plan creation returned no record.");

  if (input.hostPledged) {
    await dbFetch("enough_responses", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        plan_id: plan.id,
        participant_key_hash: hash(hostSecret),
        display_name: input.hostName,
        email: input.hostEmail,
        response: "yes",
        is_host: true,
      }),
    });
  }

  return { slug, hostSecret, hostParticipantToken: hostSecret, view: await toView(plan, hostSecret) };
}

export async function getEnoughPlan(slug: string, participantToken?: string | null) {
  return toView(await planBySlug(slug), participantToken);
}

export async function respondToEnoughPlan(slug: string, raw: unknown) {
  const input = validateRsvpPayload(raw);
  const plan = await planBySlug(slug);
  if (plan.status !== "open") throw new EnoughValidationError(plan.status === "confirmed" ? "This plan already unlocked." : "RSVPs are closed for this plan.");

  const result = await dbFetch("rpc/enough_respond", {
    method: "POST",
    body: JSON.stringify({
      p_plan_id: plan.id,
      p_participant_key_hash: hash(input.participantToken),
      p_display_name: input.name,
      p_email: input.email,
      p_response: input.response,
    }),
  });
  const payload = result as { just_confirmed?: boolean } | null;
  const fresh = await planBySlug(slug);
  if (payload?.just_confirmed) await notifyUnlock(fresh).catch(() => undefined);
  return { justConfirmed: Boolean(payload?.just_confirmed), view: await toView(fresh, input.participantToken) };
}

export async function cancelEnoughPlan(slug: string, hostSecret: string) {
  const plan = await planBySlug(slug);
  if (!hostSecret || !safeEqual(plan.host_secret_hash, hash(hostSecret))) throw new EnoughForbiddenError("Host access is invalid.");
  if (plan.status === "cancelled") return toView(plan);
  await dbFetch(`enough_plans?id=eq.${encodeURIComponent(plan.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  return toView({ ...plan, status: "cancelled" });
}

async function notifyUnlock(plan: PlanRow) {
  if (!enoughEmailConfigured()) return;
  const responses = (await responsesForPlan(plan.id))
    .filter((item) => item.response === "yes" && Boolean(item.email))
    .map((item) => ({ ...item, email: item.email! }));
  if (!responses.length) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || "https://harpreet-portfolio-tau.vercel.app";
  const from = process.env.RESEND_FROM!;
  const apiKey = process.env.RESEND_API_KEY!;
  const when = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(plan.starts_at));
  await Promise.allSettled(responses.map((recipient) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [recipient.email],
      subject: `${plan.emoji} ${plan.title} is on`,
      text: `${plan.title} reached its threshold and is officially on.\n\n${when}${plan.location ? `\n${plan.location}` : ""}\n\nSee the unlocked guest list and details: ${base}/enough/p/${plan.slug}`,
    }),
  }))));
}

export function enoughHealth() {
  return {
    status: "ok",
    persistentStoreConfigured: enoughConfigured(),
    emailNotificationsConfigured: enoughEmailConfigured(),
    privacyModel: "blind quorum before confirmation; guest list revealed only after threshold",
    deploymentMode: enoughConfigured() ? "collaborative" : "single-browser demo fallback",
  };
}
