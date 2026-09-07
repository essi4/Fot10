import { NextResponse } from "next/server";
import { getTeamBySearch, getTeamById } from "../../../../lib/sports-data";
import { getNumber10ForTeam } from "../../../../lib/number10";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("team");
  const search = searchParams.get("search")?.trim();

  if (!teamId && !search) {
    return NextResponse.json({ ok: false, error: "team or search is required" }, { status: 400 });
  }

  try {
    const teamResult = teamId ? await getTeamById(teamId) : await getTeamBySearch(search);
    const team = teamResult?.team;
    if (!team?.id) return NextResponse.json({ ok: true, team: null, players: [] });

    const players = await getNumber10ForTeam(team.id);
    return NextResponse.json({
      ok: true,
      rule: "shirt-number-10-only",
      team: { id: team.id, name: team.name, logo: team.logo, country: team.country, national: Boolean(team.national) },
      count: players.length,
      players,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Number 10 data request failed" }, { status: 502 });
  }
}
