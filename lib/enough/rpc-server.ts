import { createHash, randomBytes } from "node:crypto";
import {
  EnoughConfigError,
  EnoughForbiddenError,
  EnoughNotFoundError,
  EnoughValidationError,
  makeClientToken,
  validateCreatePayload,
  validateRsvpPayload,
  type EnoughDayOfStatus,
  type EnoughPlanView,
} from "@/lib/enough/server";

const FALLBACK_SUPABASE_URL = "https://yeejcpirmvbaffobunly.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zBeF9eCShlvTjcxr4W2P8A_G3SpioGu";

function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL).replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new EnoughConfigError("Persistent collaboration is not configured yet.");
  return { url, key };
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function makeSlug() {
  return randomBytes(7).toString("base64url").toLowerCase();
}

async function rpc(name: string, payload: Record<string, unknown>) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!response.ok) {
    throw new EnoughConfigError(`Shared plan storage is temporarily unavailable (${response.status}).`);
  }

  return body as Record<string, unknown> | null;
}

function mapRpcError(body: Record<string, unknown> | null) {
  const code = typeof body?.error === "string" ? body.error : null;
  if (!code) return;

  if (code === "NOT_FOUND") throw new EnoughNotFoundError("Plan not found.");
  if (code === "FORBIDDEN") throw new EnoughForbiddenError("This link does not authorize that action.");
  if (code === "CLOSED") throw new EnoughValidationError("Commitments are closed for this plan.");
  if (code === "INVALID_STATE") throw new EnoughValidationError("That action is not available at this stage of the plan.");
  if (code === "INVALID_STATUS") throw new EnoughValidationError("Choose a valid day-of status.");
  if (code === "INVALID_RESPONSE") throw new EnoughValidationError("Choose whether you are in or out.");
  if (code === "INVALID_DEADLINE") throw new EnoughValidationError("The commitment deadline must be in the future.");
  if (code === "INVALID_TIME_OPTIONS") throw new EnoughValidationError("Add at least one possible time.");
  if (code === "INVALID_ACTION") throw new EnoughValidationError("That host action is not supported.");
}

function getView(body: Record<string, unknown> | null) {
  mapRpcError(body);
  const view = body?.view;
  if (!view || typeof view !== "object") throw new EnoughConfigError("Shared plan storage returned an incomplete response.");
  return view as EnoughPlanView;
}

export function enoughConfigured() {
  try {
    config();
    return true;
  } catch {
    return false;
  }
}

export function enoughEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function createEnoughPlan(raw: unknown) {
  const input = validateCreatePayload(raw);
  const hostSecret = makeClientToken();
  const hostHash = hash(hostSecret);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = makeSlug();
    const body = await rpc("enough_create_plan", {
      p_slug: slug,
      p_title: input.title,
      p_emoji: input.emoji,
      p_description: input.description,
      p_time_options: input.timeOptions,
      p_place_options: input.placeOptions,
      p_starts_at: input.timeOptions[0].startsAt,
      p_location: input.placeOptions[0]?.label ?? "",
      p_deadline_at: input.deadlineAt,
      p_duration_minutes: input.durationMinutes,
      p_threshold: input.threshold,
      p_host_name: input.hostName,
      p_host_secret_hash: hostHash,
      p_host_email: input.hostEmail ?? "",
      p_host_pledged: input.hostPledged,
      p_host_task: input.hostTask,
    });

    if (body?.error === "SLUG_COLLISION") continue;
    mapRpcError(body);
    return {
      slug,
      hostSecret,
      hostParticipantToken: hostSecret,
      view: getView(body),
    };
  }

  throw new EnoughConfigError("Unable to allocate a share link right now. Please try again.");
}

export async function getEnoughPlan(slug: string, participantToken?: string | null) {
  const body = await rpc("enough_get_plan", {
    p_slug: slug,
    p_participant_key_hash: participantToken ? hash(participantToken) : null,
  });
  return getView(body);
}

export async function respondToEnoughPlan(slug: string, raw: unknown) {
  const current = await getEnoughPlan(slug);
  if (current.status !== "open") {
    throw new EnoughValidationError(current.status === "confirmed" ? "This plan already locked in." : "Commitments are closed for this plan.");
  }

  const input = validateRsvpPayload(raw, { timeOptions: current.timeOptions, placeOptions: current.placeOptions });
  const body = await rpc("enough_respond_by_slug", {
    p_slug: slug,
    p_participant_key_hash: hash(input.participantToken),
    p_display_name: input.name,
    p_email: input.email ?? "",
    p_response: input.response,
    p_time_option_ids: input.timeOptionIds,
    p_place_option_ids: input.placeOptionIds,
  });
  mapRpcError(body);

  return {
    justConfirmed: Boolean(body?.just_confirmed),
    view: getView(body),
  };
}

export async function updateEnoughPulse(slug: string, raw: unknown) {
  if (!raw || typeof raw !== "object") throw new EnoughValidationError("Invalid request body.");
  const body = raw as Record<string, unknown>;
  const participantToken = typeof body.participantToken === "string" && body.participantToken.length >= 16 ? body.participantToken : null;
  const allowed = new Set<EnoughDayOfStatus>(["on_my_way", "on_time", "10_late", "20_late", "cant_make_it"]);
  const status = typeof body.status === "string" && allowed.has(body.status as EnoughDayOfStatus)
    ? body.status as EnoughDayOfStatus
    : null;
  if (!participantToken || !status) throw new EnoughValidationError("Choose a valid day-of status.");

  const result = await rpc("enough_update_pulse", {
    p_slug: slug,
    p_participant_key_hash: hash(participantToken),
    p_status: status,
  });
  return getView(result);
}

async function hostAction(slug: string, hostSecret: string, action: "cancel" | "complete_task") {
  if (!hostSecret || hostSecret.length < 16) throw new EnoughForbiddenError("Host access is invalid.");
  const body = await rpc("enough_host_action", {
    p_slug: slug,
    p_host_secret_hash: hash(hostSecret),
    p_action: action,
  });
  return getView(body);
}

export function cancelEnoughPlan(slug: string, hostSecret: string) {
  return hostAction(slug, hostSecret, "cancel");
}

export function completeEnoughHostTask(slug: string, hostSecret: string) {
  return hostAction(slug, hostSecret, "complete_task");
}

export function enoughHealth() {
  return {
    status: "ok",
    productVersion: "fit-engine-v2",
    persistentStoreConfigured: enoughConfigured(),
    emailNotificationsConfigured: enoughEmailConfigured(),
    privacyModel: "blind quorum + private fit commitments before confirmation; only the compatible confirmed group is revealed",
    coreMechanic: "quorum + constraint intersection across time and place",
    coordination: ["calendar", "maps", "owner task", "day-of pulse"],
    storage: "Supabase PostgreSQL via capability-scoped RPCs",
    deploymentMode: enoughConfigured() ? "collaborative" : "single-browser demo fallback",
  };
}

export {
  EnoughConfigError,
  EnoughForbiddenError,
  EnoughNotFoundError,
  EnoughValidationError,
};
