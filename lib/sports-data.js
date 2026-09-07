export const DEMO_MODE = process.env.NEXT_PUBLIC_FOT10_DEMO === "true";

const API_BASE = "https://v3.football.api-sports.io";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export class SportsApiError extends Error {
  constructor(message, code = "API_ERROR", details = {}) {
    super(message);
    this.name = "SportsApiError";
    this.code = code;
    this.details = details;
  }
}

export function getSportsDataConfig() {
  return { provider: process.env.SPORTS_DATA_PROVIDER || "api-football", hasApiKey: Boolean(process.env.SPORTS_API_KEY), demoMode: DEMO_MODE };
}

function errorFromApi(status, errors, headers) {
  const message = typeof errors === "string" ? errors : errors && typeof errors === "object" ? Object.values(errors).join(" | ") : `API-Football HTTP ${status}`;
  if (status === 401 || status === 403) return new SportsApiError("کلید API فوتبال معتبر نیست یا در Vercel تنظیم نشده است.", "AUTH_ERROR", { status });
  if (status === 429) return new SportsApiError("سقف درخواست API فوتبال موقتاً پر شده است؛ چند لحظه بعد دوباره تلاش کنید.", "RATE_LIMIT", { status });
  if (status >= 500) return new SportsApiError("سرویس API فوتبال موقتاً پاسخ نمی‌دهد.", "UPSTREAM_ERROR", { status });
  return new SportsApiError(`خطای API فوتبال: ${message}`, "API_ERROR", { status, dailyRemaining: headers?.get("x-ratelimit-requests-remaining") || null, minuteRemaining: headers?.get("X-RateLimit-Remaining") || null });
}

async function apiFootball(path, params = {}) {
  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey) throw new SportsApiError("کلید SPORTS_API_KEY در محیط Production تنظیم نشده است.", "CONFIG_ERROR");

  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value)); });

  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { method: "GET", headers: { "x-apisports-key": apiKey, Accept: "application/json" }, cache: "no-store" });
      const text = await response.text();
      let payload = {};
      try { payload = text ? JSON.parse(text) : {}; } catch { payload = {}; }
      const apiErrors = payload?.errors;
      const hasApiErrors = apiErrors && (Array.isArray(apiErrors) ? apiErrors.length : Object.keys(apiErrors).length);
      if (!response.ok || hasApiErrors) {
        const error = errorFromApi(response.status, apiErrors, response.headers);
        lastError = error;
        if (RETRYABLE_STATUS.has(response.status) && attempt === 0) { await new Promise((resolve) => setTimeout(resolve, 700)); continue; }
        throw error;
      }
      return {
        response: Array.isArray(payload?.response) ? payload.response : [],
        meta: {
          results: Number(payload?.results || 0),
          paging: payload?.paging || null,
          dailyRemaining: response.headers.get("x-ratelimit-requests-remaining") || null,
          minuteRemaining: response.headers.get("X-RateLimit-Remaining") || null,
        },
      };
    } catch (error) {
      if (error instanceof SportsApiError) {
        if (error.code === "UPSTREAM_ERROR" && attempt === 0) { await new Promise((resolve) => setTimeout(resolve, 700)); continue; }
        throw error;
      }
      lastError = new SportsApiError("ارتباط سرور FOT10 با API فوتبال برقرار نشد.", "NETWORK_ERROR", { cause: error?.message || "unknown" });
      if (attempt === 0) { await new Promise((resolve) => setTimeout(resolve, 500)); continue; }
    }
  }
  throw lastError || new SportsApiError("دریافت داده فوتبال ناموفق بود.", "API_ERROR");
}

async function apiResponse(path, params = {}) { return (await apiFootball(path, params)).response; }

export async function checkSportsApiConnection() {
  if (DEMO_MODE) return { ok: true, provider: "demo", demoMode: true, hasApiKey: false };
  if (!process.env.SPORTS_API_KEY) return { ok: false, provider: "api-football", demoMode: false, hasApiKey: false, code: "CONFIG_ERROR", message: "کلید SPORTS_API_KEY در Production تنظیم نشده است." };
  try {
    const result = await apiFootball("/countries");
    return { ok: true, provider: "api-football", demoMode: false, hasApiKey: true, results: result.meta.results, dailyRemaining: result.meta.dailyRemaining, minuteRemaining: result.meta.minuteRemaining };
  } catch (error) {
    return { ok: false, provider: "api-football", demoMode: false, hasApiKey: true, code: error?.code || "API_ERROR", message: error?.message || "اتصال به API فوتبال ناموفق بود.", status: error?.details?.status || null };
  }
}

export async function getLeagueByCountry(country, preferredName) {
  if (DEMO_MODE) return null;
  let response = await apiResponse("/leagues", { country, current: true, type: "league" });
  if (!response.length) response = await apiResponse("/leagues", { country, type: "league" });
  if (!response.length) return null;
  const preferred = preferredName?.toLowerCase();
  return response.find((item) => preferred && item?.league?.name?.toLowerCase().includes(preferred)) || response[0] || null;
}

export async function getLeagueCurrentSeason(league) {
  if (DEMO_MODE) return null;
  const response = await apiResponse("/leagues", { id: league });
  const seasons = response[0]?.seasons || [];
  const withStandings = seasons.filter((season) => season?.coverage?.standings);
  return seasons.find((season) => season.current && season?.coverage?.standings)?.year || seasons.find((season) => season.current)?.year || withStandings.at(-1)?.year || seasons.at(-1)?.year || null;
}

export async function getMatches({ date, live = false, league, season, team } = {}) {
  if (DEMO_MODE) return [];
  const response = await apiResponse("/fixtures", { ...(live ? { live: "all" } : date ? { date } : {}), league, season, team, timezone: "Asia/Tehran" });
  return response.map((item) => ({ id: item.fixture?.id, league: item.league?.name, country: item.league?.country, home: item.teams?.home?.name, away: item.teams?.away?.name, homeLogo: item.teams?.home?.logo, awayLogo: item.teams?.away?.logo, date: item.fixture?.date ?? null, statusShort: item.fixture?.status?.short ?? null, status: item.fixture?.status?.long ?? null, elapsed: item.fixture?.status?.elapsed ?? null, homeScore: item.goals?.home ?? null, awayScore: item.goals?.away ?? null, venue: item.fixture?.venue?.name ?? null, city: item.fixture?.venue?.city ?? null }));
}

export async function getTeamBySearch(search) { if (DEMO_MODE) return null; const response = await apiResponse("/teams", { search }); return response.find((item) => item?.team?.national) || response[0] || null; }
export async function getTeamById(team) { if (DEMO_MODE) return null; const response = await apiResponse("/teams", { id: team }); return response.find((item) => item?.team?.national) || response[0] || null; }
export async function getTeamSquad(team) { if (DEMO_MODE) return []; const response = await apiResponse("/players/squads", { team }); return response[0]?.players || []; }
export async function getTeamFixtures(team, season) { if (DEMO_MODE) return []; return getMatches({ team, season }); }
export async function getTeamCurrentLeague(team) { if (DEMO_MODE) return null; const response = await apiResponse("/leagues", { team, current: true }); return response.find((item) => item?.league?.type === "League") || response[0] || null; }
export async function getTeamStatistics(team, league, season) { if (DEMO_MODE) return null; const response = await apiResponse("/teams/statistics", { team, league, season }); return response[0] || null; }
export async function getPlayers({ search, id, team, league, season, page = 1 } = {}) { if (DEMO_MODE) return []; return apiResponse("/players", { search, id, team, league, season, page }); }

export async function getPlayerById(id, season) {
  if (DEMO_MODE) return null;
  const seasons = season ? [Number(season)] : [new Date().getUTCFullYear(), new Date().getUTCFullYear() - 1, new Date().getUTCFullYear() - 2];
  for (const year of seasons) { const response = await apiResponse("/players", { id, season: year }); if (response[0]) return { ...response[0], _season: year }; }
  return null;
}

export async function getPlayerTransfers(player) { if (DEMO_MODE) return []; return apiResponse("/transfers", { player }); }
export async function getPlayerTrophies(player) { if (DEMO_MODE) return []; return apiResponse("/trophies", { player }); }
export async function getPlayerSidelined(player) { if (DEMO_MODE) return []; return apiResponse("/sidelined", { player }); }
export async function getTopScorers(league, season) { if (DEMO_MODE) return []; return apiResponse("/players/topscorers", { league, season }); }
export async function getTopAssists(league, season) { if (DEMO_MODE) return []; return apiResponse("/players/topassists", { league, season }); }
export async function getFixtureDetails(fixtureId) { if (DEMO_MODE) return null; const response = await apiResponse("/fixtures", { id: fixtureId }); return response[0] || null; }
export async function getFixtureEvents(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/events", { fixture: fixtureId }); }
export async function getFixtureStatistics(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/statistics", { fixture: fixtureId }); }
export async function getFixtureLineups(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/lineups", { fixture: fixtureId }); }
export async function getFixturePlayers(fixtureId) { if (DEMO_MODE) return []; return apiResponse("/fixtures/players", { fixture: fixtureId }); }
export async function getStandings(league, season) { if (DEMO_MODE) return []; return apiResponse("/standings", { league, season }); }
