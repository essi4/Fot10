import { NextResponse } from "next/server";
import { getOpenFootballMatches } from "../../../../../lib/openfootball";
import { getSportsDbDayMatches, getSportsDbLiveMatches } from "../../../../../lib/thesportsdb-day";

export const dynamic = "force-dynamic";

// Summary cards are presentation data. They must never compete with the
// real match feed for API-Football quota. The match feed remains the only
// path allowed to poll the primary provider.
const CACHE_TTL = 60 * 1000;
const LIVE_CACHE_TTL = 30 * 1000;
const cache = new Map();

const FALLBACK_COUNTRIES = new Set([
  "iran", "ایران", "england", "انگلیس", "انگلستان", "spain", "اسپانیا", "italy", "ایتالیا",
  "france", "فرانسه", "germany", "آلمان", "netherlands", "هلند", "turkey", "ترکیه",
  "saudi arabia", "عربستان سعودی", "qatar", "قطر", "portugal", "پرتغال", "belgium", "بلژیک",
  "austria", "اتریش", "denmark", "دانمارک", "scotland", "اسکاتلند", "czech republic", "چک",
  "sweden", "سوئد", "croatia", "کرواسی", "greece", "یونان",
]);

function key(date, live = false) {
  return `${live ? "live" : "day"}:${date || "now"}`;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b(fc|sc|cf|club)\b/g, "")
    .replace(/[^a-z0-9آ-ی]+/g, "")
    .trim();
}

function inScope(match) {
  const country = String(match?.country || "").trim().toLowerCase().replace(/\s+/g, " ");
  const league = String(match?.league || "").trim().toLowerCase();
  return FALLBACK_COUNTRIES.has(country)
    || /champions league|champions league elite|afc champions|uefa champions|لیگ قهرمانان/.test(league)
    || !country;
}

function dedupe(matches = []) {
  const map = new Map();
  for (const match of matches) {
    if (!match?.home || !match?.away || !inScope(match)) continue;
    const id = [String(match.date || "").slice(0, 16), normalize(match.home), normalize(match.away)].join("|");
    if (!map.has(id)) map.set(id, match);
  }
  return [...map.values()];
}

async function getFallbackDay(date) {
  const [sportsDb, openFootball] = await Promise.allSettled([
    getSportsDbDayMatches(date),
    getOpenFootballMatches(date),
  ]);

  return dedupe([
    ...(sportsDb.status === "fulfilled" ? sportsDb.value || [] : []),
    ...(openFootball.status === "fulfilled" ? openFootball.value || [] : []),
  ]);
}

function summarize(date, matches, provider = "fallback-merged") {
  return {
    date,
    count: matches.length,
    leagues: new Set(matches.map((m) => m.league).filter(Boolean)).size,
    finished: matches.filter((m) => ["FT", "AET", "PEN"].includes(String(m.statusShort || "").toUpperCase())).length,
    goals: matches.reduce((sum, m) => sum + Number(m.homeScore ?? 0) + Number(m.awayScore ?? 0), 0),
    provider,
  };
}

async function getDay(date) {
  const cacheKey = key(date);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.time < CACHE_TTL) return hit.value;

  const matches = await getFallbackDay(date);
  const value = summarize(date, matches);
  cache.set(cacheKey, { time: Date.now(), value });
  return value;
}

async function getLive() {
  const cacheKey = key(null, true);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.time < LIVE_CACHE_TTL) return hit.value;

  let matches = [];
  try {
    matches = (await getSportsDbLiveMatches(new Date().toISOString().slice(0, 10))).filter(inScope);
  } catch {}

  const value = {
    count: matches.length,
    leagues: new Set(matches.map((m) => m.league).filter(Boolean)).size,
    provider: "thesportsdb-live",
  };
  cache.set(cacheKey, { time: Date.now(), value });
  return value;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const today = searchParams.get("today");
  const yesterday = searchParams.get("yesterday");
  const tomorrow = searchParams.get("tomorrow");

  if (!today || !yesterday || !tomorrow) {
    return NextResponse.json(
      { ok: false, error: "today, yesterday and tomorrow are required" },
      { status: 400 },
    );
  }

  const [live, yesterdayData, todayData, tomorrowData] = await Promise.all([
    getLive(),
    getDay(yesterday),
    getDay(today),
    getDay(tomorrow),
  ]);

  return NextResponse.json(
    {
      ok: true,
      checkedAt: new Date().toISOString(),
      live,
      yesterday: yesterdayData,
      today: todayData,
      tomorrow: tomorrowData,
    },
    {
      headers: {
        // The summary must never serve a stale zero while the real match
        // feed has already recovered. Keep the tiny in-process cache above,
        // but prevent Vercel/CDN from freezing an old presentation result.
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
