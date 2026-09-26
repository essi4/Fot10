const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const buckets = new Map();

function now() {
  return Date.now();
}

function pruneExpired(currentTime) {
  for (const [key, bucket] of buckets) {
    if (currentTime - bucket.windowStart >= WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

export const pushSubscribeRateLimit = {
  check(key) {
    const currentTime = now();
    const clientKey = key || "unknown";
    const bucket = buckets.get(clientKey);

    if (!bucket || currentTime - bucket.windowStart >= WINDOW_MS) {
      buckets.set(clientKey, { count: 1, windowStart: currentTime });
      if (buckets.size > 1000) pruneExpired(currentTime);
      return true;
    }

    if (bucket.count >= MAX_REQUESTS) {
      return false;
    }

    bucket.count += 1;
    return true;
  },

  reset() {
    buckets.clear();
  },
};

export const PUSH_SUBSCRIBE_RATE_LIMIT = {
  windowMs: WINDOW_MS,
  maxRequests: MAX_REQUESTS,
};
