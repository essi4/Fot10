import { getStandings } from "./sports-data";

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";
const SPORTSDB_KEY = process.env.THESPORTSDB_API_KEY || "3";
const inFlight = new Map();

// Provider IDs are deliberately kept here instead of leaking provider-specific
// IDs into the UI/catalog. FOT10's Iran league is API-Football 195, while
// TheSportsDB identifies the same competition as 4742.
const DEFAULT_LEAGUE_MAP = {
  "98": "4633", // J1 League
  "195": "4742", // Persian Gulf Pro League
};

function getLeagueMap() {
  try {
    return { ...DEFAULT_LEAGUE_MAP, ...(JSON.parse(process.env.THESPORTSDB_LEAGUE_MAP || "{}")) };
  } catch {
    return DEFAULT_LEAGUE_MAP;
  }
}

function sportsDbSeason(season) {
  const value = String(season ?? "").trim();
  if (!value) return value;
  if (/^\d{4}-\d{4}$/.test(value)) return value;
  const year = Number(value);
  return Number.isFinite(year) && year >= 1900 && year <= 2200 ? `${year}-${year + 1}` : value;
}

function normalizeTable(rows, league, season) {
  return [{
    league: {
      id: Number(league),
      name: "",
      country: "",
      season: Number(season),
      standings: [rows.map((row, index) => ({
        rank: Number(row.intRank || row.intRankPosition || index + 1),
        team: {
          id: Number(row.idTeam || 0),
          name: row.strTeam || "Unknown team",
          logo: row.strBadge || row.strTeamBadge || null,
        },
        points: Number(row.intPoints || 0),
        goalsDiff: Number(row.intGoalDifference || 0),
        group: null,
        form: row.strForm || null,
        status: null,
        description: null,
        all: {
          played: Number(row.intPlayed || 0),
          win: Number(row.intWin || 0),
          draw: Number(row.intDraw || 0),
          lose: Number(row.intLoss || 0),
          goals: {
            for: Number(row.intGoalsFor || 0),
            against: Number(row.intGoalsAgainst || 0),
          },
        },
        home: null,
        away: null,
        update: new Date().toISOString(),
      }))],
    },
  }];
}

async function sportsDbJson(path, params, revalidate = 900) {
  const url = new URL(`${SPORTSDB_BASE}/${SPORTSDB_KEY}/${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) return null;
  return response.json();
}

async function getSportsDbStandings(league, season) {
  const sportsDbLeague = getLeagueMap()[String(league)];
  if (!sportsDbLeague) return null;
  const payload = await sportsDbJson("lookuptable.php", { l: sportsDbLeague, s: sportsDbSeason(season) });
  const rows = Array.isArray(payload?.table) ? payload.table : [];
  return rows.length ? normalizeTable(rows, league, season) : null;
}

async function loadStandings(league, season) {
  const errors = [];
  try {
    const data = await getStandings(league, season);
    if (Array.isArray(data) && data.length) {
      return { data, source: "api-football", cached: true, fallback: false, errors };
    }
    errors.push({ source: "api-football", code: "EMPTY_RESPONSE" });
  } catch (error) {
    errors.push({
      source: "api-football",
      code: error?.code || "API_ERROR",
      status: error?.details?.status || null,
      message: error?.message || "API-Football failed",
    });
  }

  try {
    const data = await getSportsDbStandings(league, season);
    if (data?.length) {
      return { data, source: "thesportsdb", cached: true, fallback: true, errors };
    }
    errors.push({ source: "thesportsdb", code: "EMPTY_RESPONSE" });
  } catch (error) {
    errors.push({
      source: "thesportsdb",
      code: "FALLBACK_ERROR",
      message: error?.message || "Fallback provider failed",
    });
  }

  return { data: [], source: "none", cached: false, fallback: false, errors };
}

export function getStandingsResilient(league, season) {
  const key = `standings:${league}:${season}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = loadStandings(league, season).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export function getSportsDbLeagueId(league) {
  return getLeagueMap()[String(league)] || null;
}

export function getSportsDbSeason(season) {
  return sportsDbSeason(season);
}
