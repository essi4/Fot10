export const DEMO_MODE = process.env.NEXT_PUBLIC_FOT10_DEMO === "true";

const API_BASE = "https://v3.football.api-sports.io";
const API_KEY = process.env.SPORTS_API_KEY || process.env.API_SPORTS_KEY || process.env.FOOTBALL_API_KEY;

export function getSportsDataConfig() {
  return {
    provider: process.env.SPORTS_DATA_PROVIDER || "api-football",
    hasApiKey: Boolean(API_KEY),
    demoMode: DEMO_MODE,
  };
}

async function apiFootball(path, params = {}) {
  if (!API_KEY) throw new Error("SPORTS_API_KEY is not configured in the server environment.");

  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "x-apisports-key": API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(`API-Football network error: ${error?.message || "request failed"}`);
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`API-Football returned invalid JSON (HTTP ${response.status}).`);
  }

  const errors = payload?.errors;
  if (!response.ok) {
    const detail = typeof errors === "string" ? errors : errors && Object.keys(errors).length ? JSON.stringify(errors) : `HTTP ${response.status}`;
    throw new Error(`API-Football request failed: ${detail}`);
  }
  if (errors && ((Array.isArray(errors) && errors.length) || (!Array.isArray(errors) && Object.keys(errors).length))) {
    throw new Error(`API-Football: ${typeof errors === "string" ? errors : JSON.stringify(errors)}`);
  }

  return payload?.response || [];
}

export async function getLeagueByCountry(country, preferredName) {
  if (DEMO_MODE) return null;
  let response = await apiFootball("/leagues", { country, current: true, type: "league" });
  if (!response.length) response = await apiFootball("/leagues", { country, type: "league" });
  if (!response.length) return null;
  const preferred = preferredName?.toLowerCase();
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
    ...(live ? { live: "all" } : date ? { date } : {}),
    league,
    season,
    team,
    timezone: "Asia/Tehran",
  });
  return response.map((item) => ({
    id: item.fixture?.id,
    league: item.league?.name,
    country: item.league?.country,
    leagueId: item.league?.id,
    season: item.league?.season,
    home: item.teams?.home?.name,
    away: item.teams?.away?.name,
    homeId: item.teams?.home?.id,
    awayId: item.teams?.away?.id,
    homeLogo: item.teams?.home?.logo,
    awayLogo: item.teams?.away?.logo,
    date: item.fixture?.date ?? null,
    statusShort: item.fixture?.status?.short ?? null,
    status: item.fixture?.status?.long ?? null,
    elapsed: item.fixture?.status?.elapsed ?? null,
    homeScore: item.goals?.home ?? null,
    awayScore: item.goals?.away ?? null,
    venue: item.fixture?.venue?.name ?? null,
    city: item.fixture?.venue?.city ?? null,
  }));
}

export async function getTeamBySearch(search) {
  if (DEMO_MODE) return null;
  const response = await apiFootball("/teams", { search });
  return response.find((item) => item?.team?.national) || response[0] || null;
}

export async function getTeamById(team) {
  if (DEMO_MODE) return null;
  const response = await apiFootball("/teams", { id: team });
  return response.find((item) => item?.team?.national) || response[0] || null;
}

export async function getTeamSquad(team) { if (DEMO_MODE) return []; const response = await apiFootball("/players/squads", { team }); return response[0]?.players || []; }
export async function getTeamFixtures(team, season) { if (DEMO_MODE) return []; return getMatches({ team, season }); }
export async function getTeamCurrentLeague(team) { if (DEMO_MODE) return null; const response = await apiFootball("/leagues", { team, current: true }); return response.find((item) => item?.league?.type === "League") || response[0] || null; }
export async function getTeamStatistics(team, league, season) { if (DEMO_MODE) return null; const response = await apiFootball("/teams/statistics", { team, league, season }); return response[0] || null; }

export async function getPlayers({ search, id, team, league, season, page = 1 } = {}) {
  if (DEMO_MODE) return [];
  return apiFootball("/players", { search, id, team, league, season, page });
}

export async function getPlayerById(id, season) {
  if (DEMO_MODE) return null;
  const seasons = season ? [Number(season)] : [new Date().getUTCFullYear(), new Date().getUTCFullYear() - 1, new Date().getUTCFullYear() - 2];
  for (const year of seasons) {
    const response = await apiFootball("/players", { id, season: year });
    if (response[0]) return { ...response[0], _season: year };
  }
  return null;
}

export async function getPlayerTransfers(player) { if (DEMO_MODE) return []; return apiFootball("/transfers", { player }); }
export async function getPlayerTrophies(player) { if (DEMO_MODE) return []; return apiFootball("/trophies", { player }); }
export async function getPlayerSidelined(player) { if (DEMO_MODE) return []; return apiFootball("/sidelined", { player }); }
export async function getTopScorers(league, season) { if (DEMO_MODE) return []; return apiFootball("/players/topscorers", { league, season }); }
export async function getTopAssists(league, season) { if (DEMO_MODE) return []; return apiFootball("/players/topassists", { league, season }); }

export async function getFixtureDetails(fixtureId) { if (DEMO_MODE) return null; const response = await apiFootball("/fixtures", { id: fixtureId }); return response[0] || null; }
export async function getFixtureEvents(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/events", { fixture: fixtureId }); }
export async function getFixtureStatistics(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/statistics", { fixture: fixtureId }); }
export async function getFixtureLineups(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/lineups", { fixture: fixtureId }); }
export async function getFixturePlayers(fixtureId) { if (DEMO_MODE) return []; return apiFootball("/fixtures/players", { fixture: fixtureId }); }

export async function getStandings(league, season) {
  if (DEMO_MODE) return [];
  return apiFootball("/standings", { league, season });
}
