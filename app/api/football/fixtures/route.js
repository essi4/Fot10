import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";
import { getOpenFootballMatches } from "../../../../lib/openfootball";
import { getSportsDbDayMatches } from "../../../../lib/thesportsdb-day";
import { teamName } from "../../../../lib/team-identity";
import { jsonWithCache, noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

const FALLBACK_COUNTRIES = new Set([
  "iran", "ایران",
  "england", "انگلیس", "انگلستان",
  "spain", "اسپانیا",
  "italy", "ایتالیا",
  "france", "فرانسه",
  "germany", "آلمان",
  "netherlands", "هلند",
  "turkey", "ترکیه",
  "saudi arabia", "عربستان سعودی",
  "qatar", "قطر",
  "portugal", "پرتغال",
  "belgium", "بلژیک",
  "austria", "اتریش",
  "denmark", "دانمارک",
  "scotland", "اسکاتلند",
  "czech republic", "چک",
  "sweden", "سوئد",
  "croatia", "کرواسی",
  "greece", "یونان",
]);

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b(fc|sc|cf|club)\b/g, "")
    .replace(/[^a-z0-9آ-ی]+/g, "")
    .trim();
}

function normalizeCountry(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isFallbackMatchInScope(match) {
  const country = normalizeCountry(match?.country);
  const league = normalizeCountry(match?.league);
  const continental = /champions league|champions league elite|afc champions|uefa champions|لیگ قهرمانان/.test(league);
  return FALLBACK_COUNTRIES.has(country) || continental || !country;
}

function dedupeMatches(matches = []) {
  const byKey = new Map();
  for (const match of matches) {
    if (!match?.home || !match?.away) continue;
    const key = [String(match.date || "").slice(0, 16), normalizeKey(match.home), normalizeKey(match.away)].join("|");
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
  return matches.map((match) => ({
    ...match,
    home: teamName(match.home),
    away: teamName(match.away),
    homeLogo: match.homeLogo || logos.get(normalizeKey(match.home)) || null,
    awayLogo: match.awayLogo || logos.get(normalizeKey(match.away)) || null,
  }));
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
  return enriched.filter(isFallbackMatchInScope);
}

async function fallbackResponse(date, primaryError = null, cacheProfile = "fixtures") {
  const fallbackMatches = await getTodayFallback(date);
  return jsonWithCache(
    NextResponse,
    {
      ok: true,
      provider: "fallback-merged",
      sources: ["thesportsdb-day", "openfootball"],
      scope: ["iran", "england", "spain", "italy", "france", "germany", "netherlands", "turkey", "saudi-arabia", "qatar", "portugal", "belgium", "austria", "denmark", "scotland", "czech-republic", "sweden", "croatia", "greece", "champions-leagues"],
      count: fallbackMatches.length,
      matches: fallbackMatches,
      degraded: true,
      primaryError,
    },
    cacheProfile,
  );
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

  try {
    const matches = await getMatches({ date, live, league, season });
    if (matches.length || live || !date) {
      return jsonWithCache(
        NextResponse,
        { ok: true, provider: "api-football", count: matches.length, matches },
        cacheProfile,
      );
    }
    return await fallbackResponse(date, "EMPTY_PRIMARY_RESPONSE", cacheProfile);
  } catch (error) {
    if (!live && date) {
      try {
        return await fallbackResponse(date, error?.code || "API_ERROR", cacheProfile);
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
