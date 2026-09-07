import { NextResponse } from "next/server";
import { getStandings } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const season = searchParams.get("season");
  if (!league || !season) return NextResponse.json({ ok: false, error: "league and season are required" }, { status: 400 });
  try {
    const data = await getStandings(league, season);
    return NextResponse.json({ ok: true, provider: "api-football", league, season, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Standings request failed" }, { status: 502 });
  }
}
