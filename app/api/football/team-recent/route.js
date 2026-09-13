import { NextResponse } from "next/server";
import { getMatches } from "../../../../../lib/sports-data";

export const dynamic = "force-dynamic";

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";
const SPORTSDB_KEY = process.env.THESPORTSDB_API_KEY || "3";
const SPORTSDB_LEAGUES = { "98": "4633", "195": "4742" };

function normalizeSportsDbEvent(event, teamId) {
  const homeScore = event?.intHomeScore == null || event?.intHomeScore === "" ? null : Number(event.intHomeScore);
  const awayScore = event?.intAwayScore == null || event?.intAwayScore === "" ? null : Number(event.intAwayScore);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;
  const isHome = String(event.idHomeTeam) === String(teamId) || event.strHomeTeam;
  const home = String(event.idHomeTeam) === String(teamId);
  return {
    id: Number(event.idEvent || 0),
    date: event.dateEvent || null,
    home: event.strHomeTeam || "—",
    away: event.strAwayTeam || "—",
    homeId: Number(event.idHomeTeam || 0),
    awayId: Number(event.idAwayTeam || 0),
    homeLogo: event.strHomeTeamBadge || null,
    awayLogo: event.strAwayTeamBadge || null,
    homeScore,
    awayScore,
    result: home ? (homeScore > awayScore ? "W" : homeScore < awayScore ? "L" : "D") : (awayScore > homeScore ? "W" : awayScore < homeScore ? "L" : "D"),
    venue: event.strVenue || null,
  };
}

async function sportsDbFallback(teamId, league, season) {
  const sportsDbLeague = SPORTSDB_LEAGUES[String(league)];
  if (!sportsDbLeague) return [];
  const seasonName = `${Number(season)}-${Number(season) + 1}`;
  const url = new URL(`${SPORTSDB_BASE}/${SPORTSDB_KEY}/eventsseason.php`);
  url.searchParams.set("id", sportsDbLeague);
  url.searchParams.set("s", seasonName);
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(7000) });
  if (!response.ok) return [];
  const payload = await response.json();
  return (Array.isArray(payload?.events) ? payload.events : [])
    .filter((event) => String(event.idHomeTeam) === String(teamId) || String(event.idAwayTeam) === String(teamId))
    .map((event) => normalizeSportsDbEvent(event, teamId))
    .filter(Boolean)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");
  const league = searchParams.get("league");
  const season = searchParams.get("season") || "2026";
  if (!team) return NextResponse.json({ ok: false, error: "team is required" }, { status: 400 });

  try {
    const matches = await getMatches({ team: Number(team), season: Number(season) });
    const finished = matches
      .filter((match) => (!league || String(match.leagueId) === String(league)) && ["FT", "AET", "PEN"].includes(String(match.statusShort || "").toUpperCase()) && match.homeScore != null && match.awayScore != null)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5)
      .map((match) => ({ ...match, result: String(match.homeId) === String(team) ? (match.homeScore > match.awayScore ? "W" : match.homeScore < match.awayScore ? "L" : "D") : (match.awayScore > match.homeScore ? "W" : match.awayScore < match.homeScore ? "L" : "D") }));
    if (finished.length) return NextResponse.json({ ok: true, provider: "api-football", matches: finished }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
  } catch {}

  try {
    const matches = await sportsDbFallback(team, league, season);
    return NextResponse.json({ ok: matches.length > 0, provider: "thesportsdb", matches }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
  } catch (error) {
    return NextResponse.json({ ok: false, provider: "none", matches: [], error: error?.message || "Recent matches unavailable" }, { status: 200 });
  }
}
