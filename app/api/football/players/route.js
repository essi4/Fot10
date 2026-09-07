import { NextResponse } from "next/server";
import {
  getPlayers,
  getPlayerById,
  getPlayerTransfers,
  getPlayerTrophies,
  getPlayerSidelined,
} from "../../../../lib/sports-data";

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
    if (id) {
      const player = await getPlayerById(id, season);
      if (!player) return NextResponse.json({ ok: false, error: "Player not found" }, { status: 404 });

      const [transfers, trophies, sidelined] = await Promise.allSettled([
        getPlayerTransfers(id),
        getPlayerTrophies(id),
        getPlayerSidelined(id),
      ]);

      return NextResponse.json({
        ok: true,
        count: 1,
        players: [player],
        extras: {
          transfers: transfers.status === "fulfilled" ? transfers.value : [],
          trophies: trophies.status === "fulfilled" ? trophies.value : [],
          sidelined: sidelined.status === "fulfilled" ? sidelined.value : [],
        },
      });
    }

    const results = await getPlayers({ search, team, league, season, page });
    return NextResponse.json({ ok: true, count: results.length, players: results, page });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Player data request failed" }, { status: 502 });
  }
}
