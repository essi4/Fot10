import { NextResponse } from "next/server";
import {
  getLeagueCurrentSeason,
  getTeamCurrentLeague,
  getTeamFixtures,
  getTeamSquad,
  getTeamStatistics,
  SportsApiError,
} from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

function emptyResponse(team, code, message, retryable = true) {
  return NextResponse.json({
    ok: true,
    degraded: true,
    provider: "api-football",
    team,
    league: null,
    season: null,
    statistics: null,
    squad: [],
    fixtures: [],
    error: message,
    code,
    retryable,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");

  if (!team) {
    return NextResponse.json({ ok: false, error: "team is required" }, { status: 400 });
  }

  try {
    const leagueEntry = await getTeamCurrentLeague(team);
    const league = leagueEntry?.league?.id || null;
    const season = league
      ? await getLeagueCurrentSeason(league)
      : new Date().getUTCFullYear();

    const [statistics, squad, fixtures] = await Promise.all([
      league ? getTeamStatistics(team, league, season) : Promise.resolve(null),
      getTeamSquad(team),
      getTeamFixtures(team, season),
    ]);

    return NextResponse.json({
      ok: true,
      degraded: false,
      provider: "api-football",
      league: leagueEntry?.league || null,
      season,
      statistics,
      squad,
      fixtures: fixtures.slice(0, 10),
    });
  } catch (error) {
    const code = error instanceof SportsApiError ? error.code : "API_ERROR";
    const message =
      code === "CONFIG_ERROR"
        ? "سرویس داده فوتبال هنوز به کلید API متصل نشده است."
        : code === "AUTH_ERROR"
          ? "کلید API فوتبال معتبر نیست یا دسترسی آن رد شده است."
          : code === "RATE_LIMIT"
            ? "سقف درخواست داده فوتبال پر شده است؛ کمی بعد دوباره تلاش کنید."
            : "اطلاعات این تیم فعلاً از سرویس داده فوتبال قابل دریافت نیست.";

    return emptyResponse(team, code, message, code !== "AUTH_ERROR" && code !== "CONFIG_ERROR");
  }
}
