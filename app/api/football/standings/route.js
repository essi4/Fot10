import { NextResponse } from "next/server";
import { getStandingsResilient } from "../../../../lib/football-resilient";
import { jsonWithCache, noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const season = searchParams.get("season");
  if (!league || !season) return NextResponse.json({ ok: false, error: "league and season are required" }, { status: 400, headers: noStoreHeaders() });

  try {
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
