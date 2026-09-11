const BASE = "https://www.thesportsdb.com/api/v1/json";
const KEY = process.env.THESPORTSDB_API_KEY || "3";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "LIVE", "IN PLAY", "HALFTIME", "FIRST HALF", "SECOND HALF"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "MATCH FINISHED"]);

function normalize(event) {
  const statusRaw = String(event?.strStatus || "").trim();
  const status = statusRaw.toUpperCase();
  const homeScore = event?.intHomeScore === null || event?.intHomeScore === undefined || event?.intHomeScore === "" ? null : Number(event.intHomeScore);
  const awayScore = event?.intAwayScore === null || event?.intAwayScore === undefined || event?.intAwayScore === "" ? null : Number(event.intAwayScore);
  const live = LIVE_STATUSES.has(status) || /LIVE|HALF|IN PLAY/i.test(statusRaw);
  const finished = FINISHED_STATUSES.has(status) || /FINISHED/i.test(statusRaw);
  const date = event?.dateEvent && event?.strTime ? `${event.dateEvent}T${event.strTime}` : event?.dateEvent || null;
  return {
    id: Number(event?.idEvent || 0),
    league: event?.strLeague || "مسابقات فوتبال",
    country: event?.strCountry || "",
    leagueId: Number(event?.idLeague || 0) || null,
    season: event?.strSeason || null,
    home: event?.strHomeTeam || "میزبان",
    away: event?.strAwayTeam || "مهمان",
    homeId: Number(event?.idHomeTeam || 0) || null,
    awayId: Number(event?.idAwayTeam || 0) || null,
    homeLogo: event?.strHomeTeamBadge || null,
    awayLogo: event?.strAwayTeamBadge || null,
    date,
    statusShort: live ? "LIVE" : finished ? "FT" : "NS",
    status: statusRaw || null,
    elapsed: Number(event?.intProgress || 0) || null,
    homeScore,
    awayScore,
    venue: event?.strVenue || null,
    city: event?.strCity || null,
  };
}

async function request(path, params = {}) {
  const url = new URL(`${BASE}/${KEY}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(7000) });
  if (!response.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload?.events) ? payload.events : [];
}

export async function getSportsDbDayMatches(date) {
  try {
    const events = await request("eventsday.php", { d: date, s: "Soccer" });
    return events
      .filter((event) => String(event?.strSport || "").toLowerCase() === "soccer")
      .map(normalize)
      .filter((match) => match.id && match.home && match.away);
  } catch {
    return [];
  }
}

export async function getSportsDbLiveMatches(date) {
  const matches = await getSportsDbDayMatches(date);
  return matches.filter((match) => match.statusShort === "LIVE");
}
