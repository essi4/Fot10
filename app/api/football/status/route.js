import { NextResponse } from "next/server";
import { getLeagueByCountry, getLeagueCurrentSeason, getMatches, getPlayers, getSportsDataConfig, getStandings, getTeamBySearch } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getSportsDataConfig();
  const checks = {};
  const startedAt = Date.now();

  if (!config.hasApiKey) {
    return NextResponse.json({
      ok: false,
      provider: config.provider,
      demoMode: config.demoMode,
      configured: false,
      checks: {},
      error: "SPORTS_API_KEY is missing in the server environment.",
      durationMs: Date.now() - startedAt,
    }, { status: 503 });
  }

  try {
    const league = await getLeagueByCountry("England", "Premier League");
    checks.league = Boolean(league?.league?.id);
    const leagueId = league?.league?.id;
    const season = leagueId ? await getLeagueCurrentSeason(leagueId) : null;
    checks.season = Boolean(season);

    const [fixtures, team, players] = await Promise.all([
      getMatches({ date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date()) }),
      getTeamBySearch("Arsenal"),
      leagueId && season ? getPlayers({ league: leagueId, season, page: 1 }) : [],
    ]);

    checks.fixtures = Array.isArray(fixtures);
    checks.team = Boolean(team?.team?.id);
    checks.players = Array.isArray(players);

    if (leagueId && season) {
      const standings = await getStandings(leagueId, season);
      checks.standings = Array.isArray(standings);
    } else {
      checks.standings = false;
    }

    const allPassed = Object.values(checks).every(Boolean);
    return NextResponse.json({
      ok: allPassed,
      provider: config.provider,
      demoMode: config.demoMode,
      configured: true,
      checks,
      samples: {
        fixtureCount: fixtures.length,
        team: team?.team?.name || null,
        playerCount: players.length,
        league: league?.league?.name || null,
        leagueId: leagueId || null,
        season: season || null,
      },
      durationMs: Date.now() - startedAt,
    }, { status: allPassed ? 200 : 502 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      provider: config.provider,
      demoMode: config.demoMode,
      configured: true,
      checks,
      error: error?.message || "Football provider health check failed.",
      durationMs: Date.now() - startedAt,
    }, { status: error?.status && Number.isInteger(error.status) ? error.status : 502 });
  }
}
