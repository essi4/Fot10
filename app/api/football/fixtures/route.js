import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";
import { getOpenFootballMatches } from "../../../../lib/openfootball";
import { getSportsDbDayMatches } from "../../../../lib/thesportsdb-day";
import { jsonWithCache, noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

function dedupeMatches(matches = []) {
  const byKey = new Map();
  for (const match of matches) {
    if (!match?.home || !match?.away) continue;
    const key = [
      String(match.date || "").slice(0, 16),
      String(match.home).trim().toLowerCase(),
      String(match.away).trim().toLowerCase(),
    ].join("|");
    if (!byKey.has(key)) byKey.set(key, match);
  }
  return [...byKey.values()].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

async function getTodayFallback(date) {
  const [sportsDb, openFootball] = await Promise.allSettled([
    getSportsDbDayMatches(date),
    getOpenFootballMatches(date),
  ]);
  const merged = [
    ...(sportsDb.status === "fulfilled" ? sportsDb.value || [] : []),
    ...(openFootball.status === "fulfilled" ? openFootball.value || [] : []),
  ];
  return dedupeMatches(merged);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const live = searchParams.get("live") === "true";
  const league = searchParams.get("league") || undefined;
  const season = searchParams.get("season") || undefined;
  const cacheProfile = live ? "live" : "fixtures";

  if (!live && !date && !(league && season)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_REQUEST", message: "date is required unless live=true or league+season are provided" } },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  // Primary provider stays first. Fallbacks are only used when API-Football fails,
  // so a partial fallback dataset can never hide a healthy primary response.
  try {
    const matches = await getMatches({ date, live, league, season });
    return jsonWithCache(
      NextResponse,
      { ok: true, provider: "api-football", count: matches.length, matches },
      cacheProfile,
    );
  } catch (error) {
    if (!live && date) {
      try {
        const fallbackMatches = await getTodayFallback(date);
        return jsonWithCache(
          NextResponse,
          {
            ok: true,
            provider: "fallback-merged",
            sources: ["thesportsdb-day", "openfootball"],
            count: fallbackMatches.length,
            matches: fallbackMatches,
            degraded: true,
            primaryError: error?.code || "API_ERROR",
          },
          cacheProfile,
        );
      } catch {}
    }

    return NextResponse.json(
      {
        ok: false,
        provider: "api-football",
        error: {
          code: error?.code || "API_ERROR",
          message: error?.message || "Sports API request failed",
          status: error?.details?.status || null,
        },
      },
      { status: error?.code === "CONFIG_ERROR" ? 503 : 502, headers: noStoreHeaders() },
    );
  }
}
