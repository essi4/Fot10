export const DEMO_MODE = process.env.NEXT_PUBLIC_FOT10_DEMO === "true";

const API_BASE = "https://v3.football.api-sports.io";
const REQUEST_TIMEOUT_MS = 12000;

function apiError(message, status, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

export function getSportsDataConfig() {
  return {
    provider: process.env.SPORTS_DATA_PROVIDER || "api-football",
    hasApiKey: Boolean(process.env.SPORTS_API_KEY),
    demoMode: DEMO_MODE,
    apiBase: API_BASE,
  };
}

async function apiFootball(path, params = {}, options = {}) {
  if (DEMO_MODE) return [];
  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey) throw apiError("Football data is not configured on the server.", 503, "SPORTS_API_KEY is missing");

  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);
  try {
    let response;
    try {
      response = await fetch(url, {
        headers: { "x-apisports-key": apiKey, Accept: "application/json" },
        cache: options.cache || "no-store",
        next: options.revalidate ? { revalidate: options.revalidate } : undefined,
        signal: controller.signal,
      });
    } catch (cause) {
      if (cause?.name === "AbortError") throw apiError("Football data service timed out.", 504, "API request timeout");
      throw apiError("Football data service is unreachable.", 502, cause?.message);
    }

    let payload = null;
    try { payload = await response.json(); } catch { /* empty/non-json response */ }
    if (!response.ok) throw apiError(`Football data service returned HTTP ${response.status}.`, response.status, payload?.errors || null);
    if (payload?.errors && Object.keys(payload.errors).length) throw apiError("Football data service rejected the request.", 502, payload.errors);
    return Array.isArray(payload?.response) ? payload.response : [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLeagueByCountry(country, preferredName) {
  if (DEMO_MODE) return null;
  let response = await apiFootball("/leagues", { country, current: true, type: "league" });
  if (!response.length) response = await apiFootball("/leagues", { country, type: "league" });
  if (!response.length && preferredName) response = await apiFootball("/leagues", { search: preferredName });
  if (!response.length) return null;
  const preferred = preferredName?.trim().toLowerCase();
  return response.find((item) => preferred && item?.league?.name?.toLowerCase().includes(preferred)) || response[0] || null;
}

export async function getLeagueCurrentSeason(league) {
  if (DEMO_MODE) return null;
  const response = await apiFootball("/leagues", { id: league });
  const seasons = response[0]?.seasons || [];
  const withStandings = seasons.filter((season) => season?.coverage?.standings);
  return seasons.find((season) => season.current && season?.coverage?.standings)?.year
    || seasons.find((season) => season.current)?.year
    || withStandings.at(-1)?.year
    || seasons.at(-1)?.year
    || null;
}

export async function getMatches({ date, live = false, league, season, team } = {}) {
  if (DEMO_MODE) return [];
  const response = await apiFootball("/fixtures", {
    ...(live ? { live: "all" } : date ? { date } : {}), league, season, team, timezone: "Asia/Tehran",
  }, { revalidate: live ? 15 : 60 });
  return response.map((item) => ({
    id: item.fixture?.id, league: item.league?.name, country: item.league?.country,
    home: item.teams?.home?.name, away: item.teams?.away?.name,
    homeLogo: item.teams?.home?.logo, awayLogo: item.teams?.away?.logo,
    homeTeamId: item.teams?.home?.id ?? null, awayTeamId: item.teams?.away?.id ?? null,
    leagueId: item.league?.id ?? null, season: item.league?.season ?? null,
    date: item.fixture?.date ?? null, statusShort: item.fixture?.status?.short ?? null,
    status: item.fixture?.status?.long ?? null, elapsed: item.fixture?.status?.elapsed ?? null,
    homeScore: item.goals?.home ?? null, awayScore: item.goals?.away ?? null,
    venue: item.fixture?.venue?.name ?? null, city: item.fixture?.venue?.city ?? null,
  }));
}

export async function getTeamBySearch(search) { if (DEMO_MODE) return null; const response = await apiFootball("/teams", { search }); return response.find((item) => item?.team?.national) || response[0] || null; }
export async function getTeamById(team) { if (DEMO_MODE) return null; const response = await apiFootball("/teams", { id: team }); return response.find((item) => item?.team?.national) || response[0] || null; }
export async function getTeamSquad(team) { if (DEMO_MODE) return []; const response = await apiFootball("/players/squads", { team }, { revalidate: 3600 }); return response[0]?.players || []; }
export async function getTeamFixtures(team, season) { if (DEMO_MODE) return []; return getMatches({ team, season }); }
export async function getTeamCurrentLeague(team) { if (DEMO_MODE) return null; const response = await apiFootball("/leagues", { team, current: true }); return response.find((item) => item?.league?.type === "League") || response[0] || null; }
export async function getTeamStatistics(team, league, season) { if (DEMO_MODE) return null; const response = await apiFootball("/teams/statistics", { team, league, season }, { revalidate: 3600 }); return response[0] || null; }

export async function getPlayers({ search, id, team, league, season, page = 1 } = {}) { if (DEMO_MODE) return []; return apiFootball("/players", { search, id, team, league, season, page }, { revalidate: 3600 }); }
export async function getPlayerById(id, season) {
  if (DEMO_MODE) return null;
  const seasons = season ? [Number(season)] : [new Date().getUTCFullYear(), new Date().getUTCFullYear() - 1, new Date().getUTCFullYear() - 2];
  for (const year of seasons) { const response = await apiFootball("/players", { id, season: year }, { revalidate: 3600 }); if (response[0]) return { ...response[0], _season: year }; }
  return null;
}
export async function getPlayerTransfers(player) { if (DEMO_MODE) return []; return apiFootball("/transfers", { player }, { revalidate: 3600 }); }
export async function getPlayerTrophies(player) { if (DEMO_MODE) return []; return apiFootball("/trophies", { player }, { revalidate: 3600 }); }
export async function getPlayerSidelined(player) { if (DEMO_MODE) return []; return apiFootball("/sidelined", { player }, { revalidate: 3600 }); }
export async function getTopScorers(league, season) { if (DEMO_MODE) return []; return apiFootball("/players/topscorers", { league, season }, { revalidate: 3600 }); }
export async function getTopAssists(league, season) { if (DEMO_MODE) return []; return apiFootball("/players/topassists", { league, season }, { revalidate: 3600 }); }

export async function getFixtureDetails(fixtureId) { if (DEMO_MODE) return null; const response = await apiFootball("/fixtures", { id: fixtureId }, { revalidate: 15 }); return response[0] || null; }
export async function getFixtureEvents(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/events", { fixture: fixtureId }, { revalidate: 15 }); }
export async function getFixtureStatistics(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/statistics", { fixture: fixtureId }, { revalidate: 15 }); }
export async function getFixtureLineups(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/lineups", { fixture: fixtureId }, { revalidate: 60 }); }
export async function getFixturePlayers(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/players", { fixture: fixtureId }, { revalidate: 60 }); }
export async function getStandings(league, season) { if (DEMO_MODE) return []; return apiFootball("/standings", { league, season }, { revalidate: 3600 }); }
