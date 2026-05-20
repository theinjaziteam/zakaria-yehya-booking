// In-memory sliding window rate limiter — Edge-runtime compatible (no Node builtins)
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
let cleanupTick = 0;

function evict() {
  if (++cleanupTick < 200) return;
  cleanupTick = 0;
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

/** Returns true if the request is allowed, false if it should be blocked. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  evict();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
