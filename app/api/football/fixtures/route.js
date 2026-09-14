import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";
import { getOpenFootballMatches } from "../../../../lib/openfootball";
import { getSportsDbDayMatches } from "../../../../lib/thesportsdb-day";
import { teamName } from "../../../../lib/team-identity";
import { jsonWithCache, noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

const FALLBACK_COUNTRIES = new Set([
  "iran",
  "england",
  "spain",
  "italy",
  "france",
  "germany",
  "netherlands",
  "turkey",
  "saudi arabia",
  "qatar",
]);

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b(fc|sc|cf|club)\b/g, "")
    .replace(/[^a-z0-9آ-ی]+/g, "")
    .trim();
}

function dedupeMatches(matches = []) {
  const byKey = new Map();
  for (const match of matches) {
    if (!match?.home || !match?.away) continue;
    const key = [
      String(match.date || "").slice(0, 16),
      normalizeKey(match.home),
      normalizeKey(match.away),
    ].join("|");
    if (!byKey.has(key)) byKey.set(key, match);
  }
  return [...byKey.values()].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function enrichFallbackMatches(matches, sportsDbMatches) {
  const logos = new Map();
  for (const match of sportsDbMatches || []) {
    const homeKey = normalizeKey(match.home);
    const awayKey = normalizeKey(match.away);
    if (homeKey && match.homeLogo) logos.set(homeKey, match.homeLogo);
    if (awayKey && match.awayLogo) logos.set(awayKey, match.awayLogo);
  }

  return matches.map((match) => {
    const homeKey = normalizeKey(match.home);
    const awayKey = normalizeKey(match.away);
    return {
      ...match,
      home: teamName(match.home),
      away: teamName(match.away),
      homeLogo: match.homeLogo || logos.get(homeKey) || null,
      awayLogo: match.awayLogo || logos.get(awayKey) || null,
    };
  });
}

async function getTodayFallback(date) {
  const [sportsDb, openFootball] = await Promise.allSettled([
    getSportsDbDayMatches(date),
    getOpenFootballMatches(date),
  ]);

  const sportsDbMatches = sportsDb.status === "fulfilled" ? sportsDb.value || [] : [];
  const openFootballMatches = openFootball.status === "fulfilled" ? openFootball.value || [] : [];
  const merged = dedupeMatches([...sportsDbMatches, ...openFootballMatches]);
  const enriched = enrichFallbackMatches(merged, sportsDbMatches);

  // Keep the fallback useful for FOT10's primary football scope while retaining
  // continental matches such as UEFA/AFC Champions League regardless of country.
  return enriched.filter((match) => {
    const country = String(match.country || "").trim().toLowerCase();
    const league = String(match.league || "").toLowerCase();
    const continental = /champions league|champions league elite|afc champions|uefa champions/.test(league);
    return FALLBACK_COUNTRIES.has(country) || continental || !country;
  });
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
            scope: ["iran", "england", "spain", "italy", "france", "germany", "netherlands", "turkey", "saudi-arabia", "qatar", "champions-leagues"],
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
