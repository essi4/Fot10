import { NextResponse } from "next/server";
import { searchTeams, searchPlayers, searchLeagues, getCountries } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

function normalizeQuery(value) {
  return String(value || "").trim().replace(/[يى]/g, "ی").replace(/ك/g, "ک");
}

export async function GET(request) {
  const query = normalizeQuery(new URL(request.url).searchParams.get("q"));
  if (query.length < 2) return NextResponse.json({ ok: true, query, teams: [], players: [], leagues: [], countries: [] });
  try {
    const [teams, players, leagues, countries] = await Promise.allSettled([
      searchTeams(query), searchPlayers(query), searchLeagues(query), getCountries(query),
    ]);
    return NextResponse.json({
      ok: true,
      query,
      teams: teams.status === "fulfilled" ? teams.value.slice(0, 8).map((item) => ({ id: item.team?.id, name: item.team?.name, logo: item.team?.logo, country: item.team?.country, founded: item.team?.founded })).filter((item) => item.id && item.name) : [],
      players: players.status === "fulfilled" ? players.value.slice(0, 8).map((item) => ({ id: item.player?.id, name: item.player?.name, photo: item.player?.photo, nationality: item.player?.nationality, age: item.player?.age, position: item.player?.position, team: item.statistics?.[0]?.team?.name || null })).filter((item) => item.id && item.name) : [],
      leagues: leagues.status === "fulfilled" ? leagues.value.slice(0, 8).map((item) => ({ id: item.league?.id, name: item.league?.name, logo: item.league?.logo, country: item.country?.name || item.league?.country, type: item.league?.type })).filter((item) => item.id && item.name) : [],
      countries: countries.status === "fulfilled" ? countries.value.slice(0, 8).map((item) => ({ name: item.name, code: item.code, flag: item.flag })).filter((item) => item.name) : [],
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Global search failed" }, { status: 502 });
  }
}
