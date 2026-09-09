import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";
import { getOpenFootballMatches } from "../../../../lib/openfootball";
import { jsonWithCache, noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const live = searchParams.get("live") === "true";
  const league = searchParams.get("league") || undefined;
  const season = searchParams.get("season") || undefined;
  const cacheProfile = live ? "live" : "fixtures";

  if (!live && !date && !(league && season)) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_REQUEST", message: "date is required unless live=true or league+season are provided" } }, { status: 400, headers: noStoreHeaders() });
  }

  try {
    if (!live && !league && !season) {
      const fallbackMatches = await getOpenFootballMatches(date);
      if (fallbackMatches.length > 0) {
        return jsonWithCache(NextResponse, { ok: true, provider: "openfootball", count: fallbackMatches.length, matches: fallbackMatches }, cacheProfile);
      }
    }

    const matches = await getMatches({ date, live, league, season });
    return jsonWithCache(NextResponse, { ok: true, provider: "api-football", count: matches.length, matches }, cacheProfile);
  } catch (error) {
    try {
      if (!live && date) {
        const fallbackMatches = await getOpenFootballMatches(date);
        return jsonWithCache(NextResponse, { ok: true, provider: "openfootball", count: fallbackMatches.length, matches: fallbackMatches }, cacheProfile);
      }
    } catch {}
    return NextResponse.json({ ok: false, provider: "api-football", error: { code: error?.code || "API_ERROR", message: error?.message || "Sports API request failed", status: error?.details?.status || null } }, { status: error?.code === "CONFIG_ERROR" ? 503 : 502, headers: noStoreHeaders() });
  }
}
