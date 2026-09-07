export const DEMO_MODE = process.env.NEXT_PUBLIC_FOT10_DEMO === "true";

const API_BASE = "https://v3.football.api-sports.io";

export function getSportsDataConfig() {
  return {
    provider: process.env.SPORTS_DATA_PROVIDER || "api-football",
    hasApiKey: Boolean(process.env.SPORTS_API_KEY),
    demoMode: DEMO_MODE,
  };
}

async function apiFootball(path, params = {}, { live = false } = {}) {
  if (!process.env.SPORTS_API_KEY) throw new Error("SPORTS_API_KEY is not configured.");
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, {
    headers: { "x-apisports-key": process.env.SPORTS_API_KEY },
    cache: live ? "no-store" : "no-store",
  });
  if (!response.ok) throw new Error(`API-Football HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors && Object.keys(payload.errors).length) throw new Error(`API-Football: ${JSON.stringify(payload.errors)}`);
  return payload.response || [];
}

export async function getMatches({ date, live = false, league, season } = {}) {
  if (DEMO_MODE) return [];
  const response = await apiFootball("/fixtures", {
    ...(live ? { live: "all" } : { date }), league, season, timezone: "Asia/Tehran",
  }, { live });
  return response.map((item) => ({
    id: item.fixture?.id,
    league: item.league?.name,
    country: item.league?.country,
    home: item.teams?.home?.name,
    away: item.teams?.away?.name,
    homeLogo: item.teams?.home?.logo,
    awayLogo: item.teams?.away?.logo,
    time: item.fixture?.date,
    status: item.fixture?.status?.short,
    statusLong: item.fixture?.status?.long,
    minute: item.fixture?.status?.elapsed ?? null,
    homeScore: item.goals?.home ?? null,
    awayScore: item.goals?.away ?? null,
    venue: item.fixture?.venue?.name ?? null,
    city: item.fixture?.venue?.city ?? null,
  }));
}

export async function getFixtureDetails(fixtureId) {
  if (DEMO_MODE) return null;
  const response = await apiFootball("/fixtures", { id: fixtureId });
  return response[0] || null;
}

export async function getFixtureEvents(fixtureId) {
  if (DEMO_MODE) return [];
  return apiFootball("/fixtures/events", { fixture: fixtureId });
}

export async function getFixtureStatistics(fixtureId) {
  if (DEMO_MODE) return [];
  return apiFootball("/fixtures/statistics", { fixture: fixtureId });
}

export async function getFixtureLineups(fixtureId) {
  if (DEMO_MODE) return [];
  return apiFootball("/fixtures/lineups", { fixture: fixtureId });
}

export async function getFixturePlayers(fixtureId) {
  if (DEMO_MODE) return [];
  return apiFootball("/fixtures/players", { fixture: fixtureId });
}

export async function getStandings(league, season) {
  if (DEMO_MODE) return [];
  return apiFootball("/standings", { league, season });
}
