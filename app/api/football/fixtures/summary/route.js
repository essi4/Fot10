import { NextResponse } from "next/server";
import { getMatches } from "../../../../../lib/sports-data";
import { getOpenFootballMatches } from "../../../../../lib/openfootball";
import { getSportsDbDayMatches } from "../../../../../lib/thesportsdb-day";

export const revalidate = 60;

const CACHE_TTL = 60_000;
const EMPTY_RESULT_GRACE = 10 * 60_000;
const cache = new Map();

function key(date, live = false) { return `${live ? "live" : "day"}:${date || "now"}`; }
function normalize(value) { return String(value || "").toLowerCase().replace(/\b(fc|sc|cf|club)\b/g, "").replace(/[^a-z0-9آ-ی]+/g, "").trim(); }
function dedupe(matches = []) {
  const map = new Map();
  for (const match of matches) {
    if (!match?.home || !match?.away) continue;
    const id = [String(match.date || "").slice(0, 16), normalize(match.home), normalize(match.away)].join("|");
    if (!map.has(id)) map.set(id, match);
  }
  return [...map.values()];
}

async function getFallbackDay(date) {
  const [sportsDb, openFootball] = await Promise.allSettled([getSportsDbDayMatches(date), getOpenFootballMatches(date)]);
  return dedupe([
    ...(sportsDb.status === "fulfilled" ? sportsDb.value || [] : []),
    ...(openFootball.status === "fulfilled" ? openFootball.value || [] : []),
  ]);
}

async function getDay(date) {
  const cacheKey = key(date);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.time < CACHE_TTL) return hit.value;

  let matches = [];
  let provider = "api-football";
  try {
    matches = await getMatches({ date });
    if (!matches.length) {
      const fallback = await getFallbackDay(date);
      if (fallback.length) {
        matches = fallback;
        provider = "fallback-merged";
      }
    }
  } catch {
    provider = "fallback-merged";
    matches = await getFallbackDay(date);
  }

  const value = {
    date,
    count: matches.length,
    leagues: new Set(matches.map((m) => m.league).filter(Boolean)).size,
    finished: matches.filter((m) => ["FT", "AET", "PEN"].includes(String(m.statusShort || "").toUpperCase())).length,
    goals: matches.reduce((sum, m) => sum + Number(m.homeScore ?? 0) + Number(m.awayScore ?? 0), 0),
    provider,
  };
  const previous = hit?.value;
  const previousAge = hit ? Date.now() - hit.time : Infinity;
  if (!matches.length && previous?.count > 0 && previousAge < EMPTY_RESULT_GRACE) {
    return { ...previous, provider: `${previous.provider || provider}-stable` };
  }
  cache.set(cacheKey, { time: Date.now(), value });
  return value;
}

async function getLive() {
  const cacheKey = key(null, true);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.time < 30_000) return hit.value;
  let matches = [];
  let provider = "api-football";
  try { matches = await getMatches({ live: true }); } catch { provider = "unavailable"; }
  const previous = hit?.value;
  const value = { count: matches.length, leagues: new Set(matches.map((m) => m.league).filter(Boolean)).size, provider };
  if (!matches.length && previous?.count > 0) return { ...previous, provider: `${previous.provider || provider}-stable` };
  cache.set(cacheKey, { time: Date.now(), value });
  return value;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const today = searchParams.get("today");
  const yesterday = searchParams.get("yesterday");
  const tomorrow = searchParams.get("tomorrow");
  if (!today || !yesterday || !tomorrow) return NextResponse.json({ ok: false, error: "today, yesterday and tomorrow are required" }, { status: 400 });
  const [live, yesterdayData, todayData, tomorrowData] = await Promise.all([getLive(), getDay(yesterday), getDay(today), getDay(tomorrow)]);
  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), live, yesterday: yesterdayData, today: todayData, tomorrow: tomorrowData }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
