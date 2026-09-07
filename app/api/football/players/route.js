import { NextResponse } from "next/server";
import { getPlayers } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const id = searchParams.get("id") || undefined;
  const team = searchParams.get("team") || undefined;
  const league = searchParams.get("league") || undefined;
  const season = searchParams.get("season") || undefined;
  const page = Number(searchParams.get("page") || 1);

  if (!search && !id && !team && !league) {
    return NextResponse.json({ ok: false, error: "search, id, team or league is required" }, { status: 400 });
  }

  try {
    const results = await getPlayers({ search, id, team, league, season, page });
    return NextResponse.json({ ok: true, count: results.length, players: results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Player data request failed" }, { status: 502 });
  }
}
