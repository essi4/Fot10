const API_BASE = "https://v3.football.api-sports.io";
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const CACHE_TTL_MS = 30_000;
let cachedHealth = null;
let cachedAt = 0;
let inFlight = null;

function apiKey() {
  const raw = process.env.SPORTS_API_KEY || process.env.API_SPORTS_KEY || process.env.FOOTBALL_API_KEY;
  return raw?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function liveStatus(match) {
  const status = String(match?.fixture?.status?.short || "").trim().toUpperCase();
  return LIVE_CODES.has(status) || /LIVE|IN PLAY|HALF/i.test(status);
}

async function checkPrimary() {
  const key = apiKey();
  if (!key) return { ok: false, code: "CONFIG_ERROR", message: "SPORTS_API_KEY is not configured", provider: "api-football" };

  const started = Date.now();
  let response;
  try {
    const url = new URL(`${API_BASE}/fixtures`);
    url.searchParams.set("live", "all");
    url.searchParams.set("timezone", "Asia/Tehran");
    response = await fetch(url, {
      method: "GET",
      headers: { "x-apisports-key": key, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    return { ok: false, code: error?.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_ERROR", message: error?.message || "API-Football request failed", provider: "api-football", latencyMs: Date.now() - started };
  }

  const latencyMs = Date.now() - started;
  const dailyRemaining = response.headers.get("x-ratelimit-requests-remaining");
  const minuteRemaining = response.headers.get("X-RateLimit-Remaining");
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }

  if (!response.ok || (payload?.errors && Object.keys(payload.errors).length)) {
    const errors = payload?.errors;
    return {
      ok: false,
      code: response.status === 401 || response.status === 403 ? "AUTH_ERROR" : response.status === 429 ? "RATE_LIMIT" : response.status >= 500 ? "UPSTREAM_ERROR" : "API_ERROR",
      httpStatus: response.status,
      message: typeof errors === "string" ? errors : errors && Object.values(errors).join(" | ") || `HTTP ${response.status}`,
      provider: "api-football",
      latencyMs,
      rateLimit: { dailyRemaining, minuteRemaining },
    };
  }

  const matches = Array.isArray(payload?.response) ? payload.response : [];
  const liveMatches = matches.filter(liveStatus);
  return {
    ok: true,
    provider: "api-football",
    latencyMs,
    httpStatus: response.status,
    apiResults: Number(payload?.results || matches.length || 0),
    liveMatches: liveMatches.length,
    rateLimit: { dailyRemaining, minuteRemaining },
    checkedStatuses: [...new Set(matches.map((m) => m?.fixture?.status?.short).filter(Boolean))],
  };
}

async function checkFallback() {
  const started = Date.now();
  try {
    const url = new URL("https://www.thesportsdb.com/api/v1/json/3/eventsday.php");
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    url.searchParams.set("d", date);
    url.searchParams.set("s", "Soccer");
    const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(7000) });
    if (!response.ok) return { ok: false, provider: "thesportsdb", httpStatus: response.status, latencyMs: Date.now() - started };
    const payload = await response.json();
    const events = Array.isArray(payload?.events) ? payload.events : [];
    const liveMatches = events.filter((event) => /LIVE|HALF|IN PLAY/i.test(String(event?.strStatus || ""))).length;
    return { ok: true, provider: "thesportsdb", latencyMs: Date.now() - started, events: events.length, liveMatches };
  } catch (error) {
    return { ok: false, provider: "thesportsdb", code: error?.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_ERROR", message: error?.message || "Fallback provider failed", latencyMs: Date.now() - started };
  }
}

export async function getLiveHealth({ deep = false, force = false } = {}) {
  const now = Date.now();
  if (!force && !deep && cachedHealth && now - cachedAt < CACHE_TTL_MS) return { ...cachedHealth, cached: true, cacheAgeMs: now - cachedAt };
  if (!force && deep && cachedHealth && now - cachedAt < CACHE_TTL_MS) return { ...cachedHealth, cached: true, cacheAgeMs: now - cachedAt };
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const checkedAt = new Date().toISOString();
    const primary = await checkPrimary();
    const fallback = primary.ok ? { checked: false, reason: "primary_ok" } : await checkFallback();
    const health = {
      ok: primary.ok,
      checkedAt,
      service: "fot10-live-api",
      primary,
      fallback,
      diagnosis: primary.ok ? "provider_ok" : fallback.ok ? "primary_failed_fallback_ok" : "all_providers_failed",
      cacheTtlMs: CACHE_TTL_MS,
    };
    cachedHealth = health;
    cachedAt = Date.now();
    return health;
  })().finally(() => { inFlight = null; });

  return inFlight;
}
