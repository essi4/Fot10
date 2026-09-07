import { NextResponse } from "next/server";
import { getLeagueCurrentSeason, getTeamCurrentLeague, getTeamFixtures, getTeamSquad, getTeamStatistics } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");
  if (!team) return NextResponse.json({ ok: false, error: "team is required" }, { status: 400 });
  try {
    const leagueEntry = await getTeamCurrentLeague(team);
    const league = leagueEntry?.league?.id || null;
    const season = league ? await getLeagueCurrentSeason(league) : new Date().getUTCFullYear();
    const [statistics, squad, fixtures] = await Promise.all([
      league ? getTeamStatistics(team, league, season) : Promise.resolve(null),
      getTeamSquad(team),
      getTeamFixtures(team, season),
    ]);
    return NextResponse.json({ ok: true, league: leagueEntry?.league || null, season, statistics, squad, fixtures: fixtures.slice(0, 10) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Team statistics request failed" }, { status: 502 });
  }
}
