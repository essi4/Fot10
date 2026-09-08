import { getStandings } from "./sports-data";

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";
const SPORTSDB_KEY = process.env.THESPORTSDB_API_KEY || "3";
const inFlight = new Map();

const DEFAULT_LEAGUE_MAP = { "98": "4633" };

function getLeagueMap() {
  try { return { ...DEFAULT_LEAGUE_MAP, ...(JSON.parse(process.env.THESPORTSDB_LEAGUE_MAP || "{}")) }; }
  catch { return DEFAULT_LEAGUE_MAP; }
}

function normalizeTable(rows, league, season) {
  return [{
    league: { id: Number(league), name: "", country: "", season: Number(season), standings: [rows.map((row) => ({
      rank: Number(row.intRank || row.intRankPosition || 0),
      team: { id: Number(row.idTeam || 0), name: row.strTeam || "Unknown team", logo: row.strBadge || row.strTeamBadge || null },
      points: Number(row.intPoints || 0), goalsDiff: Number(row.intGoalDifference || 0), group: null,
      form: row.strForm || null, status: null, description: null,
      all: { played: Number(row.intPlayed || 0), win: Number(row.intWin || 0), draw: Number(row.intDraw || 0), lose: Number(row.intLoss || 0), goals: { for: Number(row.intGoalsFor || 0), against: Number(row.intGoalsAgainst || 0) } },
      home: null, away: null, update: new Date().toISOString(),
    }))] },
  }];
}

async function getSportsDbStandings(league, season) {
  const sportsDbLeague = getLeagueMap()[String(league)];
  if (!sportsDbLeague) return null;
  const url = new URL(`${SPORTSDB_BASE}/${SPORTSDB_KEY}/lookuptable.php`);
  url.searchParams.set("l", sportsDbLeague);
  url.searchParams.set("s", String(season));
  const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 900 }, signal: AbortSignal.timeout(6000) });
  if (!response.ok) return null;
  const payload = await response.json();
  const rows = Array.isArray(payload?.table) ? payload.table : [];
  return rows.length ? normalizeTable(rows, league, season) : null;
}

async function loadStandings(league, season) {
  const errors = [];
  try {
    const data = await getStandings(league, season);
    if (Array.isArray(data) && data.length) return { data, source: "api-football", cached: true, fallback: false, errors };
    errors.push({ source: "api-football", code: "EMPTY_RESPONSE" });
  } catch (error) {
    errors.push({ source: "api-football", code: error?.code || "API_ERROR", status: error?.details?.status || null, message: error?.message || "API-Football failed" });
  }
  try {
    const data = await getSportsDbStandings(league, season);
    if (data?.length) return { data, source: "thesportsdb", cached: true, fallback: true, errors };
    errors.push({ source: "thesportsdb", code: "EMPTY_RESPONSE" });
  } catch (error) {
    errors.push({ source: "thesportsdb", code: "FALLBACK_ERROR", message: error?.message || "Fallback provider failed" });
  }
  return { data: [], source: "none", cached: false, fallback: false, errors };
}

export function getStandingsResilient(league, season) {
  const key = `${league}:${season}`;
  // Coalesce identical concurrent requests on the same server instance.
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = loadStandings(league, season).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
