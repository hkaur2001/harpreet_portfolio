export type RetryResult<T> = {
  data: T;
  retries: number;
  status: number;
};

export class UpstreamRequestError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "UpstreamRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

const RETRYABLE_STATUS = new Set([408, 409, 429]);

function retryAfterMs(response: Response) {
  const value = response.headers.get("retry-after");
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryable(status: number) {
  return RETRYABLE_STATUS.has(status) || status >= 500;
}

export async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit,
  options: { attempts?: number; baseDelayMs?: number; maxDelayMs?: number; timeoutMs?: number } = {},
): Promise<RetryResult<T>> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = Math.max(25, options.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 1600);
  const timeoutMs = Math.max(1000, options.timeoutMs ?? 25_000);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (response.ok) {
        return { data: await response.json() as T, retries: attempt, status: response.status };
      }

      const canRetry = retryable(response.status);
      if (!canRetry || attempt === attempts - 1) {
        throw new UpstreamRequestError(`Upstream request failed (${response.status}).`, response.status, canRetry);
      }

      const headerDelay = retryAfterMs(response);
      const exponential = Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
      const jitter = Math.floor(Math.random() * Math.max(20, exponential * 0.2));
      await sleep(Math.min(maxDelayMs, headerDelay ?? exponential + jitter));
    } catch (error) {
      lastError = error;
      if (error instanceof UpstreamRequestError) throw error;
      if (attempt === attempts - 1) break;
      const exponential = Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
      const jitter = Math.floor(Math.random() * Math.max(20, exponential * 0.2));
      await sleep(exponential + jitter);
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("Upstream request failed after retries.");
}

export function openAiUrl(path: string) {
  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}
