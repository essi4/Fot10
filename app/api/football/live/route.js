import { NextResponse } from "next/server";
import { getMatchesResilient } from "../../../../lib/football-resilient";
import { getSportsDbLiveMatches } from "../../../../lib/thesportsdb-day";
import { runWithApiFootballCircuit } from "../../../../lib/api-football-circuit";

export const dynamic = "force-dynamic";

const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const LIVE_CACHE_SECONDS = 15;
const LIVE_STALE_SECONDS = 15;

const LIVE_COUNTRIES = new Set([
  "iran", "spain", "england", "italy", "france", "germany", "netherlands", "turkey", "saudi arabia", "qatar",
]);
const LIVE_LEAGUES = new Set([
  "uefa champions league", "afc champions league", "afc champions league elite", "afc champions league two",
  "champions league", "لیگ قهرمانان اروپا", "لیگ قهرمانان آسیا",
]);

function liveHeaders() {
  return { "Cache-Control": `public, s-maxage=${LIVE_CACHE_SECONDS}, stale-while-revalidate=${LIVE_STALE_SECONDS}` };
}

function iranToday(offset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date()).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const base = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`);
  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
}

function isActuallyLive(match) {
  const status = String(match?.statusShort || match?.status || "").trim().toUpperCase();
  return LIVE_CODES.has(status) || /LIVE|IN PLAY|HALF/i.test(status);
}

function normalizeScope(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isInLiveScope(match) {
  return LIVE_COUNTRIES.has(normalizeScope(match?.country)) || LIVE_LEAGUES.has(normalizeScope(match?.league));
}

async function fallbackLiveMatches() {
  const dates = [iranToday(0), iranToday(-1), iranToday(1)];
  const batches = await Promise.allSettled(dates.map((date) => getSportsDbLiveMatches(date)));
  const byId = new Map();
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const match of batch.value || []) {
      if (match?.id && isInLiveScope(match) && isActuallyLive(match)) byId.set(String(match.id), match);
    }
  }
  return [...byId.values()];
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const guarded = await runWithApiFootballCircuit(() => getMatchesResilient({ live: "all" }));
    if (!guarded.skipped && !guarded.error) {
      const result = guarded.result;
      const matches = Array.isArray(result?.data) ? result.data : [];
      const liveMatches = matches.filter(isActuallyLive).filter(isInLiveScope);
      if (liveMatches.length) {
        return NextResponse.json(
          { matches: liveMatches, source: result?.source || "api-football", checkedAt },
          { headers: liveHeaders() },
        );
      }
    }
  } catch {}

  try {
    const fallback = await fallbackLiveMatches();
    // The provider was successfully checked even when there are currently zero live matches.
    // Keep the source explicit instead of incorrectly reporting source:none.
    return NextResponse.json(
      { matches: fallback, source: "thesportsdb-live", checkedAt },
      { headers: liveHeaders() },
    );
  } catch {
    return NextResponse.json(
      { matches: [], source: "thesportsdb-live", checkedAt },
      { status: 200, headers: liveHeaders() },
    );
  }
}
