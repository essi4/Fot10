import { NextResponse } from "next/server";
import { getStandings, getMatches } from "../../../../lib/sports-data";
import { getStandingsResilient } from "../../../../lib/football-resilient";
import { jsonWithCache, noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

const FINAL_STATUSES = new Set(["FT", "AET", "PEN"]);
const IRAN_LEAGUE = "195";
const IRAN_SEASON = "2026";

function normalizeTeamName(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/[.\-_'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveFromFixtures(fixtures) {
  const table = new Map();
  const ensure = (team, teamId, logo) => {
    const key = String(teamId || normalizeTeamName(team));
    if (!table.has(key)) table.set(key, { team: { id: teamId || key, name: team, logo: logo || null }, rank: 0, points: 0, goalsDiff: 0, group: "overall", form: [], all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } } });
    return table.get(key);
  };

  for (const match of fixtures || []) {
    if (!FINAL_STATUSES.has(String(match.statusShort || "").toUpperCase())) continue;
    if (match.homeScore == null || match.awayScore == null) continue;
    const home = ensure(match.home, match.homeId, match.homeLogo);
    const away = ensure(match.away, match.awayId, match.awayLogo);
    const hs = Number(match.homeScore);
    const as = Number(match.awayScore);
    home.all.played += 1; away.all.played += 1;
    home.all.goals.for += hs; home.all.goals.against += as;
    away.all.goals.for += as; away.all.goals.against += hs;
    if (hs > as) { home.all.win += 1; away.all.lose += 1; home.points += 3; home.form.push("W"); away.form.push("L"); }
    else if (hs < as) { away.all.win += 1; home.all.lose += 1; away.points += 3; away.form.push("W"); home.form.push("L"); }
    else { home.all.draw += 1; away.all.draw += 1; home.points += 1; away.points += 1; home.form.push("D"); away.form.push("D"); }
  }

  return [...table.values()]
    .map((row) => ({ ...row, goalsDiff: row.all.goals.for - row.all.goals.against, form: row.form.slice(-5).join("") }))
    .sort((a, b) => b.points - a.points || b.goalsDiff - a.goalsDiff || b.all.goals.for - a.all.goals.for || String(a.team.name).localeCompare(String(b.team.name)))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const season = searchParams.get("season");
  if (!league || !season) return NextResponse.json({ ok: false, error: "league and season are required" }, { status: 400, headers: noStoreHeaders() });

  try {
    // For the current Persian Gulf Pro League, always prefer the live API-Football table.
    // This prevents the old hardcoded snapshot from becoming the visible source.
    if (league === IRAN_LEAGUE && season === IRAN_SEASON) {
      try {
        const live = await getStandings(league, season);
        if (Array.isArray(live) && live.length >= 18) {
          return jsonWithCache(NextResponse, { ok: true, provider: "api-football-live", fallback: false, cached: false, league, season, data: live, errors: [] }, "standings-live");
        }
      } catch (error) {
        // Continue to the fixture-derived fallback below.
      }

      try {
        const fixtures = await getMatches({ league, season });
        const derived = deriveFromFixtures(fixtures);
        if (derived.length >= 18) {
          return jsonWithCache(NextResponse, { ok: true, provider: "api-football-fixtures-derived", fallback: true, cached: false, league, season, data: derived, errors: [] }, "standings-derived");
        }
      } catch (error) {
        // Continue to the existing resilient providers.
      }
    }

    const result = await getStandingsResilient(league, season);
    return jsonWithCache(NextResponse, {
      ok: result.data.length > 0,
      provider: result.source,
      fallback: result.fallback,
      cached: result.cached,
      league,
      season,
      data: result.data,
      errors: result.errors,
    }, "standings");
  } catch (error) {
    return NextResponse.json({ ok: false, provider: "none", fallback: false, error: error?.message || "Standings request failed" }, { status: 502, headers: noStoreHeaders() });
  }
}
