import { getStandings, getMatches } from "./sports-data";

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";
const SPORTSDB_KEY = process.env.THESPORTSDB_API_KEY || "3";
const inFlight = new Map();

const DEFAULT_LEAGUE_MAP = {
  "98": "4633",
  "195": "4742",
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
  return [{ league: { id: Number(league), name: "", country: "", season: Number(season), standings: [rows.map((row, index) => ({
    rank: Number(row.intRank || row.intRankPosition || index + 1),
    team: { id: Number(row.idTeam || 0), name: row.strTeam || "Unknown team", logo: row.strBadge || row.strTeamBadge || null },
    points: Number(row.intPoints || 0), goalsDiff: Number(row.intGoalDifference || 0), group: null, form: row.strForm || null, status: null, description: null,
    all: { played: Number(row.intPlayed || 0), win: Number(row.intWin || 0), draw: Number(row.intDraw || 0), lose: Number(row.intLoss || 0), goals: { for: Number(row.intGoalsFor || 0), against: Number(row.intGoalsAgainst || 0) } },
    home: null, away: null, update: new Date().toISOString(),
  }))] } }];
}

function buildStandingsFromEvents(events, league, season) {
  const teams = new Map();
  const ensureTeam = (id, name, logo) => {
    const key = String(id || name || "");
    if (!key) return null;
    if (!teams.has(key)) teams.set(key, {
      id: Number(id || 0), name: name || "Unknown team", logo: logo || null,
      played: 0, win: 0, draw: 0, lose: 0, gf: 0, ga: 0, points: 0,
    });
    const team = teams.get(key);
    if (!team.logo && logo) team.logo = logo;
    return team;
  };

  for (const event of events || []) {
    const homeScore = Number(event?.homeScore);
    const awayScore = Number(event?.awayScore);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;
    const home = ensureTeam(event.homeId, event.home, event.homeLogo);
    const away = ensureTeam(event.awayId, event.away, event.awayLogo);
    if (!home || !away) continue;
    home.played += 1; away.played += 1;
    home.gf += homeScore; home.ga += awayScore;
    away.gf += awayScore; away.ga += homeScore;
    if (homeScore > awayScore) { home.win += 1; home.points += 3; away.lose += 1; }
    else if (homeScore < awayScore) { away.win += 1; away.points += 3; home.lose += 1; }
    else { home.draw += 1; away.draw += 1; home.points += 1; away.points += 1; }
  }

  const rows = [...teams.values()]
    .sort((a, b) => (b.points - a.points) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf) || a.name.localeCompare(b.name))
    .map((team, index) => ({
      rank: index + 1,
      team: { id: team.id, name: team.name, logo: team.logo },
      points: team.points,
      goalsDiff: team.gf - team.ga,
      group: null, form: null, status: null, description: null,
      all: { played: team.played, win: team.win, draw: team.draw, lose: team.lose, goals: { for: team.gf, against: team.ga } },
      home: null, away: null, update: new Date().toISOString(),
    }));

  return rows.length ? [{ league: { id: Number(league), name: "", country: "", season: Number(season), standings: [rows] } }] : null;
}

function normalizeEvent(event, league, season) {
  const date = event?.dateEvent && event?.strTime ? `${event.dateEvent}T${event.strTime}` : event?.dateEvent || null;
  const homeScore = event?.intHomeScore === null || event?.intHomeScore === undefined || event?.intHomeScore === "" ? null : Number(event.intHomeScore);
  const awayScore = event?.intAwayScore === null || event?.intAwayScore === undefined || event?.intAwayScore === "" ? null : Number(event.intAwayScore);
  const status = String(event?.strStatus || "").toUpperCase();
  const finished = ["FT", "AET", "PEN", "MATCH FINISHED"].includes(status) || (homeScore !== null && awayScore !== null);
  return {
    id: Number(event.idEvent || 0), league: event.strLeague || "لیگ برتر ایران", country: event.strCountry || "Iran", leagueId: Number(league), season: Number(season),
    home: event.strHomeTeam, away: event.strAwayTeam, homeId: Number(event.idHomeTeam || 0), awayId: Number(event.idAwayTeam || 0),
    homeLogo: event.strHomeTeamBadge || null, awayLogo: event.strAwayTeamBadge || null, date,
    statusShort: finished ? "FT" : status === "NS" ? "NS" : status || "NS", status: event.strStatus || null, elapsed: null,
    homeScore, awayScore, venue: event.strVenue || null, city: event.strCity || null,
  };
}

async function sportsDbJson(path, params, revalidate = 900) {
  const url = new URL(`${SPORTSDB_BASE}/${SPORTSDB_KEY}/${path}`);
  Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value)); });
  const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate }, signal: AbortSignal.timeout(7000) });
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

async function getSportsDbSeasonMatches(league, season) {
  const sportsDbLeague = getLeagueMap()[String(league)];
  if (!sportsDbLeague) return [];
  const payload = await sportsDbJson("eventsseason.php", { id: sportsDbLeague, s: sportsDbSeason(season) }, 600);
  const events = Array.isArray(payload?.events) ? payload.events : [];
  return events.map((event) => normalizeEvent(event, league, season)).filter((item) => item.id && item.home && item.away);
}

const IRAN_2026_SCORERS = [
  ["Amirhossein Hosseinzadeh", 4], ["Masoud Mohebi", 3], ["Ali Alipour Ghara", 3],
  ["Shahriar Moghanlou", 2], ["Tomislav Štrkalj", 2], ["Saeb Mohebi", 2],
  ["Jasir Asani", 2], ["Saeid Saharkhizan Gendishmin", 2], ["Esmaeil Gholizadeh Samian", 2],
  ["Erfan Ghahremani", 2],
];
const IRAN_2026_ASSISTS = [
  ["Esmaeil Babaei", 3], ["Ali Alipour Ghara", 3], ["Hojjat Ahmadi", 2],
  ["Amirhossein Farsi", 2], ["Abbas Kahrizi", 2], ["Majid Eydi", 2],
  ["Sasan Ansari", 2], ["Mahan Sadeghi Digehsara", 2], ["Alireza Safar Beiranvand", 1],
  ["Ali Asghar Aarabi Darb Ghale", 1],
];

function iranPlayerSnapshot(kind, league, season) {
  if (String(league) !== "195" || Number(season) !== 2026) return null;
  const rows = kind === "assists" ? IRAN_2026_ASSISTS : IRAN_2026_SCORERS;
  return rows.map(([name, value], index) => ({
    player: { id: `iran-${kind}-${index + 1}`, name },
    statistics: [{ goals: kind === "assists" ? { total: 0, assists: value } : { total: value, assists: 0 } }],
    _source: "verified-2026-27-snapshot",
  }));
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
    if (data?.length) {
      const rows = data.flatMap((item) => item?.league?.standings?.flat?.() || []);
      if (rows.length >= 18) return { data, source: "thesportsdb", cached: true, fallback: true, errors };
      const events = await getSportsDbSeasonMatches(league, season);
      const derived = buildStandingsFromEvents(events, league, season);
      if (derived?.length) return { data: derived, source: "thesportsdb-events", cached: true, fallback: true, errors: [...errors, { source: "thesportsdb-table", code: "FREE_LIMIT", count: rows.length }] };
      return { data, source: "thesportsdb", cached: true, fallback: true, errors };
    }
    errors.push({ source: "thesportsdb", code: "EMPTY_RESPONSE" });
  } catch (error) {
    errors.push({ source: "thesportsdb", code: "FALLBACK_ERROR", message: error?.message || "Fallback provider failed" });
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

export async function getPlayerStatsResilient(kind, league, season, primaryLoader) {
  const key = `player-stats:${kind}:${league}:${season}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = (async () => {
    try {
      const data = await primaryLoader(league, season);
      if (Array.isArray(data) && data.length) return { data, source: "api-football", fallback: false };
    } catch {}
    const snapshot = iranPlayerSnapshot(kind, league, season);
    if (snapshot?.length) return { data: snapshot, source: "verified-2026-27-snapshot", fallback: true };
    return { data: [], source: "none", fallback: false };
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export async function getMatchesResilient({ date, live = false, league, season, team } = {}) {
  const key = `matches:${date || ""}:${live}:${league || ""}:${season || ""}:${team || ""}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = (async () => {
    try {
      const data = await getMatches({ date, live, league, season, team });
      if (Array.isArray(data) && data.length) return { data, source: "api-football", fallback: false };
    } catch {}
    try {
      const data = await getSportsDbSeasonMatches(league, season);
      if (date) {
        const day = String(date);
        return { data: data.filter((item) => String(item.date || "").slice(0, 10) === day), source: "thesportsdb", fallback: true };
      }
      return { data, source: "thesportsdb", fallback: true };
    } catch {
      return { data: [], source: "none", fallback: false };
    }
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export function getSportsDbLeagueId(league) { return getLeagueMap()[String(league)] || null; }
export function getSportsDbSeason(season) { return sportsDbSeason(season); }
