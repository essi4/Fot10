export const DEMO_MODE = process.env.NEXT_PUBLIC_FOT10_DEMO === "true";

const API_BASE = "https://v3.football.api-sports.io";
const API_KEY = process.env.SPORTS_API_KEY || process.env.API_SPORTS_KEY || process.env.FOOTBALL_API_KEY;
const inFlight = new Map();

export class SportsApiError extends Error {
  constructor(message, code = "API_ERROR", details = {}) { super(message); this.name = "SportsApiError"; this.code = code; this.details = details; }
}

export function getSportsDataConfig() { return { provider: process.env.SPORTS_DATA_PROVIDER || "api-football", hasApiKey: Boolean(API_KEY), demoMode: DEMO_MODE }; }

function makeApiError(status, errors, headers) {
  const detail = typeof errors === "string" ? errors : errors && typeof errors === "object" ? Object.values(errors).join(" | ") : `HTTP ${status}`;
  const details = { status, dailyRemaining: headers?.get("x-ratelimit-requests-remaining") || null, minuteRemaining: headers?.get("X-RateLimit-Remaining") || null };
  if (status === 401 || status === 403) return new SportsApiError("کلید API فوتبال معتبر نیست یا دسترسی آن رد شده است.", "AUTH_ERROR", details);
  if (status === 429) return new SportsApiError("سقف درخواست API فوتبال پر شده است؛ کمی بعد دوباره تلاش کنید.", "RATE_LIMIT", details);
  if (status >= 500) return new SportsApiError("سرویس API فوتبال موقتاً پاسخ نمی‌دهد.", "UPSTREAM_ERROR", details);
  return new SportsApiError(`خطای API فوتبال: ${detail}`, "API_ERROR", details);
}

function stableParams(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
}

async function dedupeRequest(key, fn) {
  const existing = inFlight.get(key);
  if (existing) return existing;
  const promise = Promise.resolve().then(fn).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

async function apiFootball(path, params = {}, options = {}) {
  if (!API_KEY) throw new SportsApiError("کلید SPORTS_API_KEY در محیط سرور تنظیم نشده است.", "CONFIG_ERROR");
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value)); });

  const requestKey = `${url.toString()}|revalidate=${options.revalidate || 0}|timeout=${options.timeout || 8000}`;
  return dedupeRequest(requestKey, async () => {
    const response = await fetch(url, {
      method: "GET",
      headers: { "x-apisports-key": API_KEY, Accept: "application/json" },
      ...(options.revalidate ? { next: { revalidate: options.revalidate } } : { cache: "no-store" }),
      signal: AbortSignal.timeout(options.timeout ?? 8000),
    });

    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : {}; }
    catch { throw new SportsApiError(`API-Football returned invalid JSON (HTTP ${response.status}).`, "INVALID_RESPONSE", { status: response.status }); }

    const errors = payload?.errors;
    const hasErrors = errors && (Array.isArray(errors) ? errors.length : Object.keys(errors).length);
    if (!response.ok || hasErrors) throw makeApiError(response.status, errors, response.headers);

    return {
      response: Array.isArray(payload?.response) ? payload.response : [],
      meta: {
        results: Number(payload?.results || 0),
        paging: payload?.paging || null,
        dailyRemaining: response.headers.get("x-ratelimit-requests-remaining") || null,
        minuteRemaining: response.headers.get("X-RateLimit-Remaining") || null,
      },
    };
  });
}

async function apiResponse(path, params = {}, options = {}) { return (await apiFootball(path, params, options)).response; }

export async function checkSportsApiConnection() {
  if (DEMO_MODE) return { ok: true, provider: "demo", demoMode: true, hasApiKey: false };
  if (!API_KEY) return { ok: false, provider: "api-football", demoMode: false, hasApiKey: false, code: "CONFIG_ERROR", message: "کلید SPORTS_API_KEY در Production تنظیم نشده است." };
  try { const result = await apiFootball("/countries", {}, { revalidate: 300 }); return { ok: true, provider: "api-football", demoMode: false, hasApiKey: true, results: result.meta.results, dailyRemaining: result.meta.dailyRemaining, minuteRemaining: result.meta.minuteRemaining }; }
  catch (error) { return { ok: false, provider: "api-football", demoMode: false, hasApiKey: true, code: error?.code || "API_ERROR", message: error?.message || "اتصال به API فوتبال ناموفق بود.", status: error?.details?.status || null }; }
}

export async function getLeagueByCountry(country, preferredName) {
  if (DEMO_MODE) return null;
  let response = await apiResponse("/leagues", { country, current: true, type: "league" }, { revalidate: 3600 });
  if (!response.length && preferredName) response = await apiResponse("/leagues", { search: preferredName }, { revalidate: 3600 });
  if (!response.length) return null;
  const preferred = preferredName?.toLowerCase();
  return response.find((item) => preferred && item?.league?.name?.toLowerCase().includes(preferred)) || response[0] || null;
}

export async function getLeagueCurrentSeason(league) {
  if (DEMO_MODE) return null;
  const response = await apiResponse("/leagues", { id: league }, { revalidate: 3600 });
  const seasons = response[0]?.seasons || [];
  const currentYear = new Date().getUTCFullYear();
  const usable = seasons.filter((season) => season?.year && (season?.coverage?.fixtures?.date || season?.coverage?.standings || season?.coverage?.players || season?.coverage?.top_scorers || season?.coverage?.top_assists));
  const usableCurrentYear = usable.filter((season) => Number(season.year) <= currentYear);
  return seasons.find((season) => season.current && Number(season.year) <= currentYear && season?.coverage?.fixtures?.date && season?.coverage?.standings)?.year
    || seasons.find((season) => season.current && Number(season.year) <= currentYear && season?.coverage?.fixtures?.date)?.year
    || usableCurrentYear.find((season) => season?.current)?.year
    || usableCurrentYear.at(-1)?.year
    || usable.find((season) => season?.current)?.year
    || seasons.find((season) => season.current)?.year
    || seasons.at(-1)?.year
    || null;
}

function normalizeFixture(item) {
  return { id: item.fixture?.id, league: item.league?.name, country: item.league?.country, leagueId: item.league?.id, season: item.league?.season, home: item.teams?.home?.name, away: item.teams?.away?.name, homeId: item.teams?.home?.id, awayId: item.teams?.away?.id, homeLogo: item.teams?.home?.logo, awayLogo: item.teams?.away?.logo, date: item.fixture?.date ?? null, statusShort: item.fixture?.status?.short ?? null, status: item.fixture?.status?.long ?? null, elapsed: item.fixture?.status?.elapsed ?? null, homeScore: item.goals?.home ?? null, awayScore: item.goals?.away ?? null, venue: item.fixture?.venue?.name ?? null, city: item.fixture?.venue?.city ?? null };
}

export async function getMatches({ date, live = false, league, season, team } = {}) {
  if (DEMO_MODE) return [];
  const baseParams = { league, season, team, timezone: "Asia/Tehran" };
  const response = await apiResponse("/fixtures", { ...(live ? { live: "all" } : date ? { date } : {}), ...baseParams }, { revalidate: live ? 30 : 60 });
  return response.map(normalizeFixture);
}

export async function getTeamBySearch(search) { if (DEMO_MODE) return null; const response = await apiResponse("/teams", { search }, { revalidate: 3600 }); return response[0] || null; }
export async function getTeamById(team) { if (DEMO_MODE) return null; const response = await apiResponse("/teams", { id: team }, { revalidate: 3600 }); return response[0] || null; }
export async function getTeamSquad(team) { if (DEMO_MODE) return []; const response = await apiResponse("/players/squads", { team }, { revalidate: 3600 }); return response[0]?.players || []; }
export async function getTeamFixtures(team, season) { if (DEMO_MODE) return []; return getMatches({ team, season }); }
export async function getTeamCurrentLeague(team) { if (DEMO_MODE) return null; const response = await apiResponse("/leagues", { team, current: true }, { revalidate: 3600 }); return response.find((item) => item?.league?.type === "League") || response[0] || null; }
export async function getTeamStatistics(team, league, season) { if (DEMO_MODE) return null; const response = await apiResponse("/teams/statistics", { team, league, season }, { revalidate: 3600 }); return response[0] || null; }
export async function getPlayers({ search, id, team, league, season, page = 1 } = {}) { if (DEMO_MODE) return []; return apiResponse("/players", { search, id, team, league, season, page }, { revalidate: 3600 }); }

export async function getPlayerById(id, season) {
  if (DEMO_MODE) return null;
  const seasons = season ? [Number(season)] : [new Date().getUTCFullYear()];
  for (const year of seasons) {
    const response = await apiResponse("/players", { id, season: year }, { revalidate: 3600 });
    if (response[0]) return { ...response[0], _season: year };
  }
  return null;
}

export async function getPlayerTransfers(player) { if (DEMO_MODE) return []; return apiResponse("/transfers", { player }, { revalidate: 3600 }); }
export async function getPlayerTrophies(player) { if (DEMO_MODE) return []; return apiResponse("/trophies", { player }, { revalidate: 3600 }); }
export async function getPlayerSidelined(player) { if (DEMO_MODE) return []; return apiResponse("/sidelined", { player }, { revalidate: 3600 }); }
export async function getTopScorers(league, season) { if (DEMO_MODE) return []; return apiResponse("/players/topscorers", { league, season }, { revalidate: 3600 }); }
export async function getTopAssists(league, season) { if (DEMO_MODE) return []; return apiResponse("/players/topassists", { league, season }, { revalidate: 3600 }); }
export async function getFixtureDetails(fixtureId) { if (DEMO_MODE) return null; const response = await apiResponse("/fixtures", { id: fixtureId }, { revalidate: 30 }); return response[0] || null; }
export async function getFixtureEvents(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/events", { fixture: fixtureId }, { revalidate: 30 }); }
export async function getFixtureStatistics(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/statistics", { fixture: fixtureId }, { revalidate: 60 }); }
export async function getFixtureLineups(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/lineups", { fixture: fixtureId }, { revalidate: 60 }); }
export async function getFixturePlayers(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/players", { fixture: fixtureId }, { revalidate: 60 }); }
export async function getStandings(league, season) { if (DEMO_MODE) return []; return apiResponse("/standings", { league, season }, { revalidate: 3600 }); }
