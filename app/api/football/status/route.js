import { NextResponse } from "next/server";
import { checkSportsApiConnection, getFixtureDetails, getFixtureEvents, getFixtureLineups, getFixturePlayers, getFixtureStatistics, getLeagueByCountry, getLeagueCurrentSeason, getMatches, getPlayers, getStandings, getTeamBySearch, getTeamStatistics, getTopAssists, getTopScorers } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";
const todayTehran = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());

export async function GET() {
  const startedAt = Date.now();
  const connection = await checkSportsApiConnection();
  if (!connection.ok) return NextResponse.json({ ok: false, provider: connection.provider, demoMode: connection.demoMode, connected: false, keyConfigured: Boolean(connection.hasApiKey), code: connection.code, message: connection.message, status: connection.status || null, checkedAt: new Date().toISOString(), durationMs: Date.now() - startedAt, secretExposed: false }, { status: connection.code === "CONFIG_ERROR" ? 503 : 502 });

  const checks = {};
  try {
    const league = await getLeagueByCountry("England", "Premier League");
    checks.league = Boolean(league?.league?.id);
    const leagueId = league?.league?.id || null;
    const season = leagueId ? await getLeagueCurrentSeason(leagueId) : null;
    checks.season = Boolean(season);
    const date = todayTehran();
    const base = await Promise.allSettled([
      getMatches({ date }),
      getTeamBySearch("Arsenal"),
      leagueId && season ? getPlayers({ league: leagueId, season, page: 1 }) : Promise.resolve([]),
      leagueId && season ? getStandings(leagueId, season) : Promise.resolve([]),
      leagueId && season ? getTopScorers(leagueId, season) : Promise.resolve([]),
      leagueId && season ? getTopAssists(leagueId, season) : Promise.resolve([]),
    ]);
    const [fixturesResult, teamResult, playersResult, standingsResult, scorersResult, assistsResult] = base;
    checks.fixtures = fixturesResult.status === "fulfilled" && Array.isArray(fixturesResult.value);
    checks.team = teamResult.status === "fulfilled" && Boolean(teamResult.value?.team?.id);
    checks.players = playersResult.status === "fulfilled" && Array.isArray(playersResult.value);
    checks.standings = standingsResult.status === "fulfilled" && Array.isArray(standingsResult.value);
    checks.topScorers = scorersResult.status === "fulfilled" && Array.isArray(scorersResult.value);
    checks.topAssists = assistsResult.status === "fulfilled" && Array.isArray(assistsResult.value);

    const sampleFixtures = fixturesResult.status === "fulfilled" ? fixturesResult.value : [];
    const sampleFixtureId = sampleFixtures.find((item) => item?.id)?.id || null;
    if (sampleFixtureId) {
      const matchChecks = await Promise.allSettled([getFixtureDetails(sampleFixtureId), getFixtureEvents(sampleFixtureId), getFixtureStatistics(sampleFixtureId), getFixtureLineups(sampleFixtureId), getFixturePlayers(sampleFixtureId)]);
      checks.fixtureDetails = matchChecks[0].status === "fulfilled" && Boolean(matchChecks[0].value);
      checks.fixtureEvents = matchChecks[1].status === "fulfilled" && Array.isArray(matchChecks[1].value);
      checks.fixtureStatistics = matchChecks[2].status === "fulfilled" && Array.isArray(matchChecks[2].value);
      checks.fixtureLineups = matchChecks[3].status === "fulfilled" && Array.isArray(matchChecks[3].value);
      checks.fixturePlayers = matchChecks[4].status === "fulfilled" && Array.isArray(matchChecks[4].value);
    } else {
      checks.fixtureDetails = null; checks.fixtureEvents = null; checks.fixtureStatistics = null; checks.fixtureLineups = null; checks.fixturePlayers = null;
    }
    if (checks.team && leagueId && season) checks.teamStatistics = Boolean(await getTeamStatistics(teamResult.value.team.id, leagueId, season));
    else checks.teamStatistics = false;

    const required = Object.entries(checks).filter(([, value]) => value !== null);
    const allPassed = required.length > 0 && required.every(([, value]) => value === true);
    return NextResponse.json({ ok: allPassed, provider: connection.provider, demoMode: connection.demoMode, connected: true, keyConfigured: true, checks, samples: { date, league: league?.league?.name || null, leagueId, season, fixtureCount: sampleFixtures.length, sampleFixtureId, team: teamResult.status === "fulfilled" ? teamResult.value?.team?.name || null : null, playerCount: playersResult.status === "fulfilled" ? playersResult.value.length : 0, scorerCount: scorersResult.status === "fulfilled" ? scorersResult.value.length : 0, assistCount: assistsResult.status === "fulfilled" ? assistsResult.value.length : 0 }, quota: { dailyRemaining: connection.dailyRemaining || null, minuteRemaining: connection.minuteRemaining || null }, checkedAt: new Date().toISOString(), durationMs: Date.now() - startedAt, secretExposed: false }, { status: allPassed ? 200 : 502 });
  } catch (error) {
    return NextResponse.json({ ok: false, provider: connection.provider, connected: true, keyConfigured: true, checks, code: error?.code || "API_ERROR", message: error?.message || "Football data smoke test failed.", status: error?.details?.status || null, checkedAt: new Date().toISOString(), durationMs: Date.now() - startedAt, secretExposed: false }, { status: 502 });
  }
}
