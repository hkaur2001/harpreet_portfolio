import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  responseFitsWinningPlan,
  solveEnoughFit,
  type EnoughFitResponse,
  type EnoughPlaceOption,
  type EnoughTimeOption,
} from "@/lib/enough/match";

export type EnoughStatus = "open" | "confirmed" | "expired" | "cancelled";
export type EnoughResponse = "yes" | "no";
export type EnoughDayOfStatus = "on_my_way" | "on_time" | "10_late" | "20_late" | "cant_make_it";

export type EnoughPlanView = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  startsAt: string;
  location: string;
  deadlineAt: string;
  durationMinutes: number;
  threshold: number;
  status: EnoughStatus;
  yesCount: number;
  bestFitCount: number;
  interestedCount: number;
  remaining: number;
  hostName: string;
  hostPledged: boolean | null;
  hostTask: string;
  hostTaskDone: boolean;
  timeOptions: EnoughTimeOption[];
  placeOptions: EnoughPlaceOption[];
  winningTimeId: string | null;
  winningPlaceId: string | null;
  guestList: Array<{ name: string; isHost: boolean; dayOfStatus: EnoughDayOfStatus | null }> | null;
  viewerResponse: EnoughResponse | null;
  viewerFit: { timeOptionIds: string[]; placeOptionIds: string[] } | null;
  viewerDayOfStatus: EnoughDayOfStatus | null;
  viewerIsConfirmedGuest: boolean;
  createdAt: string;
  confirmedAt: string | null;
};

type PlanRow = {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  description: string;
  time_options: unknown;
  place_options: unknown;
  starts_at?: string;
  location?: string;
  deadline_at: string;
  duration_minutes: number | null;
  threshold: number;
  status: EnoughStatus;
  host_name: string;
  host_secret_hash: string;
  host_pledged: boolean;
  host_task: string | null;
  host_task_done: boolean | null;
  winning_time_id: string | null;
  winning_place_id: string | null;
  created_at: string;
  confirmed_at: string | null;
};

type ResponseRow = {
  display_name: string;
  response: EnoughResponse;
  participant_key_hash: string;
  is_host: boolean;
  email: string | null;
  time_option_ids: string[] | null;
  place_option_ids: string[] | null;
  day_of_status: EnoughDayOfStatus | null;
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

function normalizeTimeOptions(value: unknown, fallback?: unknown): EnoughTimeOption[] {
  const raw = Array.isArray(value) ? value : fallback ? [{ startsAt: fallback }] : [];
  if (raw.length < 1 || raw.length > 4) throw new EnoughValidationError("Add between 1 and 4 possible times.");
  return raw.map((item, index) => {
    if (!item || typeof item !== "object") throw new EnoughValidationError("A time option is invalid.");
    const row = item as Record<string, unknown>;
    const startsAt = dateValue(row.startsAt, `Time option ${index + 1}`);
    const label = optionalText(row.label, 60);
    return { id: `t${index + 1}`, startsAt: startsAt.toISOString(), ...(label ? { label } : {}) };
  });
}

function normalizePlaceOptions(value: unknown, fallback?: unknown): EnoughPlaceOption[] {
  const raw = Array.isArray(value)
    ? value
    : typeof fallback === "string" && fallback.trim()
      ? [{ label: fallback }]
      : [];
  if (raw.length > 4) throw new EnoughValidationError("Add no more than 4 possible places.");
  return raw
    .map((item, index) => {
      if (typeof item === "string") return { id: `p${index + 1}`, label: cleanText(item, 160, `Place option ${index + 1}`) };
      if (!item || typeof item !== "object") throw new EnoughValidationError("A place option is invalid.");
      const row = item as Record<string, unknown>;
      return { id: `p${index + 1}`, label: cleanText(row.label, 160, `Place option ${index + 1}`) };
    })
    .filter((item) => item.label.length > 0);
}

function parseTimeOptions(value: unknown, fallback?: string): EnoughTimeOption[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.startsAt !== "string") return [];
      return [{ id: row.id, startsAt: row.startsAt, ...(typeof row.label === "string" && row.label ? { label: row.label } : {}) }];
    });
  }
  return fallback ? [{ id: "t1", startsAt: fallback }] : [];
}

function parsePlaceOptions(value: unknown, fallback?: string): EnoughPlaceOption[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.label !== "string") return [];
      return [{ id: row.id, label: row.label }];
    });
  }
  return fallback ? [{ id: "p1", label: fallback }] : [];
}

export function validateCreatePayload(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new EnoughValidationError("Invalid request body.");
  const body = raw as Record<string, unknown>;
  const title = cleanText(body.title, 90, "Plan title", 3);
  const emoji = typeof body.emoji === "string" && body.emoji.trim() ? body.emoji.trim().slice(0, 8) : "✨";
  const description = optionalText(body.description, 400);
  const hostName = cleanText(body.hostName, 60, "Your name", 1);
  const hostEmail = validEmail(body.hostEmail);
  const deadlineAt = dateValue(body.deadlineAt, "Commitment deadline");
  const threshold = Number(body.threshold);
  const durationMinutes = Number(body.durationMinutes ?? 120);
  const hostPledged = body.hostPledged !== false;
  const hostTask = optionalText(body.hostTask, 120);
  const timeOptions = normalizeTimeOptions(body.timeOptions, body.startsAt);
  const placeOptions = normalizePlaceOptions(body.placeOptions, body.location);

  if (!Number.isInteger(threshold) || threshold < 2 || threshold > 30) throw new EnoughValidationError("Threshold must be between 2 and 30 people.");
  if (!Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 480) throw new EnoughValidationError("Plan duration must be between 30 minutes and 8 hours.");
  if (deadlineAt.getTime() <= Date.now()) throw new EnoughValidationError("The commitment deadline must be in the future.");
  const earliestStart = Math.min(...timeOptions.map((item) => new Date(item.startsAt).getTime()));
  if (earliestStart <= deadlineAt.getTime()) throw new EnoughValidationError("Every possible start time must be after the commitment deadline.");
  if (earliestStart > Date.now() + 1000 * 60 * 60 * 24 * 60) throw new EnoughValidationError("Enough is designed for plans within the next 60 days.");

  return {
    title,
    emoji,
    description,
    hostName,
    hostEmail,
    deadlineAt: deadlineAt.toISOString(),
    threshold,
    durationMinutes,
    hostPledged,
    hostTask,
    timeOptions,
    placeOptions,
  };
}

export function validateRsvpPayload(raw: unknown, plan: { timeOptions: EnoughTimeOption[]; placeOptions: EnoughPlaceOption[] }) {
  if (!raw || typeof raw !== "object") throw new EnoughValidationError("Invalid request body.");
  const body = raw as Record<string, unknown>;
  const name = cleanText(body.name, 60, "Your name", 1);
  const email = validEmail(body.email);
  const response = body.response === "yes" || body.response === "no" ? body.response : null;
  const participantToken = typeof body.participantToken === "string" && body.participantToken.length >= 16 ? body.participantToken : null;
  if (!response) throw new EnoughValidationError("Choose whether you are in or out.");
  if (!participantToken) throw new EnoughValidationError("Participant token is missing.");

  const allowedTimes = new Set(plan.timeOptions.map((item) => item.id));
  const allowedPlaces = new Set(plan.placeOptions.map((item) => item.id));
  const timeOptionIds = Array.isArray(body.timeOptionIds) ? body.timeOptionIds.filter((item): item is string => typeof item === "string" && allowedTimes.has(item)) : [];
  const placeOptionIds = Array.isArray(body.placeOptionIds) ? body.placeOptionIds.filter((item): item is string => typeof item === "string" && allowedPlaces.has(item)) : [];

  if (response === "yes" && !timeOptionIds.length) throw new EnoughValidationError("Choose at least one time you can genuinely make.");
  if (response === "yes" && plan.placeOptions.length && !placeOptionIds.length) throw new EnoughValidationError("Choose at least one place you would genuinely go to.");

  return { name, email, response, participantToken, timeOptionIds, placeOptionIds } as const;
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
  const body = await dbFetch(`enough_responses?plan_id=eq.${encodeURIComponent(planId)}&select=display_name,response,participant_key_hash,is_host,email,time_option_ids,place_option_ids,day_of_status&order=created_at.asc`);
  return Array.isArray(body) ? body as ResponseRow[] : [];
}

function fitShape(item: ResponseRow): EnoughFitResponse {
  return {
    response: item.response,
    timeOptionIds: Array.isArray(item.time_option_ids) ? item.time_option_ids : [],
    placeOptionIds: Array.isArray(item.place_option_ids) ? item.place_option_ids : [],
  };
}

async function toView(plan: PlanRow, participantToken?: string | null): Promise<EnoughPlanView> {
  const responses = await responsesForPlan(plan.id);
  const timeOptions = parseTimeOptions(plan.time_options, plan.starts_at);
  const placeOptions = parsePlaceOptions(plan.place_options, plan.location);
  const fit = solveEnoughFit(timeOptions, placeOptions, responses.map(fitShape));
  const winningTimeId = plan.status === "confirmed" ? (plan.winning_time_id || fit.winningTimeId) : null;
  const winningPlaceId = plan.status === "confirmed" ? (plan.winning_place_id || fit.winningPlaceId) : null;
  const winningTime = timeOptions.find((item) => item.id === winningTimeId) ?? timeOptions[0];
  const winningPlace = placeOptions.find((item) => item.id === winningPlaceId) ?? placeOptions[0];
  const viewerHash = participantToken ? hash(participantToken) : null;
  const viewer = viewerHash ? responses.find((item) => safeEqual(item.participant_key_hash, viewerHash)) : undefined;
  const revealed = plan.status === "confirmed";
  const confirmedGuests = revealed
    ? responses.filter((item) => responseFitsWinningPlan(fitShape(item), winningTimeId, winningPlaceId))
    : [];
  const viewerIsConfirmedGuest = Boolean(viewer && revealed && responseFitsWinningPlan(fitShape(viewer), winningTimeId, winningPlaceId));

  return {
    slug: plan.slug,
    title: plan.title,
    emoji: plan.emoji,
    description: plan.description,
    startsAt: winningTime?.startsAt ?? plan.starts_at ?? "",
    location: winningPlace?.label ?? plan.location ?? "",
    deadlineAt: plan.deadline_at,
    durationMinutes: plan.duration_minutes ?? 120,
    threshold: plan.threshold,
    status: plan.status,
    yesCount: fit.bestFitCount,
    bestFitCount: fit.bestFitCount,
    interestedCount: fit.interestedCount,
    remaining: Math.max(0, plan.threshold - fit.bestFitCount),
    hostName: plan.host_name,
    hostPledged: revealed ? plan.host_pledged : null,
    hostTask: plan.host_task ?? "",
    hostTaskDone: Boolean(plan.host_task_done),
    timeOptions,
    placeOptions,
    winningTimeId,
    winningPlaceId,
    guestList: revealed ? confirmedGuests.map((item) => ({ name: item.display_name, isHost: item.is_host, dayOfStatus: item.day_of_status })) : null,
    viewerResponse: viewer?.response ?? null,
    viewerFit: viewer ? { timeOptionIds: fitShape(viewer).timeOptionIds, placeOptionIds: fitShape(viewer).placeOptionIds } : null,
    viewerDayOfStatus: viewer?.day_of_status ?? null,
    viewerIsConfirmedGuest,
    createdAt: plan.created_at,
    confirmedAt: plan.confirmed_at,
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
      time_options: input.timeOptions,
      place_options: input.placeOptions,
      starts_at: input.timeOptions[0].startsAt,
      location: input.placeOptions[0]?.label ?? "",
      deadline_at: input.deadlineAt,
      duration_minutes: input.durationMinutes,
      threshold: input.threshold,
      status: "open",
      host_name: input.hostName,
      host_secret_hash: hash(hostSecret),
      host_pledged: input.hostPledged,
      host_task: input.hostTask,
      host_task_done: false,
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
        time_option_ids: input.timeOptions.map((item) => item.id),
        place_option_ids: input.placeOptions.map((item) => item.id),
      }),
    });
  }

  return { slug, hostSecret, hostParticipantToken: hostSecret, view: await toView(plan, hostSecret) };
}

export async function getEnoughPlan(slug: string, participantToken?: string | null) {
  return toView(await planBySlug(slug), participantToken);
}

export async function respondToEnoughPlan(slug: string, raw: unknown) {
  const plan = await planBySlug(slug);
  if (plan.status !== "open") throw new EnoughValidationError(plan.status === "confirmed" ? "This plan already locked in." : "Commitments are closed for this plan.");
  const timeOptions = parseTimeOptions(plan.time_options, plan.starts_at);
  const placeOptions = parsePlaceOptions(plan.place_options, plan.location);
  const input = validateRsvpPayload(raw, { timeOptions, placeOptions });

  const result = await dbFetch("rpc/enough_respond", {
    method: "POST",
    body: JSON.stringify({
      p_plan_id: plan.id,
      p_participant_key_hash: hash(input.participantToken),
      p_display_name: input.name,
      p_email: input.email,
      p_response: input.response,
      p_time_option_ids: input.timeOptionIds,
      p_place_option_ids: input.placeOptionIds,
    }),
  });
  const payload = result as { just_confirmed?: boolean } | null;
  const fresh = await planBySlug(slug);
  if (payload?.just_confirmed) await notifyUnlock(fresh).catch(() => undefined);
  return { justConfirmed: Boolean(payload?.just_confirmed), view: await toView(fresh, input.participantToken) };
}

export async function updateEnoughPulse(slug: string, raw: unknown) {
  if (!raw || typeof raw !== "object") throw new EnoughValidationError("Invalid request body.");
  const body = raw as Record<string, unknown>;
  const participantToken = typeof body.participantToken === "string" && body.participantToken.length >= 16 ? body.participantToken : null;
  const allowed = new Set<EnoughDayOfStatus>(["on_my_way", "on_time", "10_late", "20_late", "cant_make_it"]);
  const status = typeof body.status === "string" && allowed.has(body.status as EnoughDayOfStatus) ? body.status as EnoughDayOfStatus : null;
  if (!participantToken || !status) throw new EnoughValidationError("Choose a valid day-of status.");

  const plan = await planBySlug(slug);
  if (plan.status !== "confirmed") throw new EnoughValidationError("Day-of updates unlock only after the plan is confirmed.");
  const responses = await responsesForPlan(plan.id);
  const response = responses.find((item) => safeEqual(item.participant_key_hash, hash(participantToken)));
  if (!response) throw new EnoughForbiddenError("This participant is not part of the confirmed plan.");
  const view = await toView(plan, participantToken);
  if (!view.viewerIsConfirmedGuest) throw new EnoughForbiddenError("This participant is not part of the confirmed plan.");

  await dbFetch(`enough_responses?plan_id=eq.${encodeURIComponent(plan.id)}&participant_key_hash=eq.${encodeURIComponent(hash(participantToken))}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ day_of_status: status, updated_at: new Date().toISOString() }),
  });
  return toView(plan, participantToken);
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

export async function completeEnoughHostTask(slug: string, hostSecret: string) {
  const plan = await planBySlug(slug);
  if (!hostSecret || !safeEqual(plan.host_secret_hash, hash(hostSecret))) throw new EnoughForbiddenError("Host access is invalid.");
  if (plan.status !== "confirmed") throw new EnoughValidationError("The coordination task unlocks only after the plan is confirmed.");
  if (!plan.host_task) return toView(plan, hostSecret);
  await dbFetch(`enough_plans?id=eq.${encodeURIComponent(plan.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ host_task_done: true }),
  });
  return toView({ ...plan, host_task_done: true }, hostSecret);
}

async function notifyUnlock(plan: PlanRow) {
  if (!enoughEmailConfigured()) return;
  const view = await toView(plan);
  const responses = await responsesForPlan(plan.id);
  const matching = responses.filter((item) => item.email && responseFitsWinningPlan(fitShape(item), view.winningTimeId, view.winningPlaceId));
  if (!matching.length) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || "https://harpreet-portfolio-tau.vercel.app";
  const from = process.env.RESEND_FROM!;
  const apiKey = process.env.RESEND_API_KEY!;
  const when = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(view.startsAt));
  await Promise.allSettled(matching.map((recipient) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [recipient.email!],
      subject: `${plan.emoji} ${plan.title} found a fit — it's on`,
      text: `${plan.title} found a combination that ${plan.threshold} people can actually make.\n\n${when}${view.location ? `\n${view.location}` : ""}\n\nSee the confirmed group, calendar links, and day-of status board: ${base}/enough/p/${plan.slug}`,
    }),
  })));
}

export function enoughHealth() {
  return {
    status: "ok",
    productVersion: "fit-engine-v2",
    persistentStoreConfigured: enoughConfigured(),
    emailNotificationsConfigured: enoughEmailConfigured(),
    privacyModel: "blind fit commitments before confirmation; only the compatible confirmed group is revealed",
    coreMechanic: "quorum + constraint intersection across time and place",
    coordination: ["calendar", "maps", "owner task", "day-of pulse"],
    deploymentMode: enoughConfigured() ? "collaborative" : "single-browser demo fallback",
  };
}
