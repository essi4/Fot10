import { NextResponse } from "next/server";
import { getOpenFootballMatches } from "../../../../../lib/openfootball";
import { getSportsDbDayMatches, getSportsDbLiveMatches } from "../../../../../lib/thesportsdb-day";

export const dynamic = "force-dynamic";

// Summary cards are presentation data. They must never compete with the
// real match feed for API-Football quota. The match feed remains the only
// path allowed to poll the primary provider.
const CACHE_TTL = 5 * 60_000;
const LIVE_CACHE_TTL = 30_000;
const cache = new Map();

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

function dedupe(matches = []) {
  const map = new Map();
  for (const match of matches) {
    if (!match?.home || !match?.away) continue;
    const id = [
      String(match.date || "").slice(0, 16),
      normalize(match.home),
      normalize(match.away),
    ].join("|");
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
    matches = await getSportsDbLiveMatches(new Date().toISOString().slice(0, 10));
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
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
