type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function allowLiveInvestigation(key: string, limit = 3, windowMs = 15 * 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}
