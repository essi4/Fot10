import { NextResponse } from "next/server";
import { getMatchesResilient } from "../../../../lib/football-resilient";
import { getSportsDbLiveMatches } from "../../../../lib/thesportsdb-day";
import { runWithApiFootballCircuit } from "../../../../lib/api-football-circuit";
import { isMatchCenterScope } from "../../../../lib/match-center-scope";
import { annotateMatchesWithFootball360Signal, normalizeFootball360LiveResponse, DEFAULT_FOOTBALL360_LIVE_URL } from "../../../../lib/football360-live.cjs";

export const dynamic = "force-dynamic";

const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const LIVE_CACHE_SECONDS = 15;
const LIVE_STALE_SECONDS = 15;

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

function isInLiveScope(match) {
  return isMatchCenterScope(match);
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
  let football360Signal = [];
  try {
    const url = process.env.FOOTBALL360_LIVE_API_URL || DEFAULT_FOOTBALL360_LIVE_URL;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "FOT10/1.0" } });
      if (response.ok) football360Signal = normalizeFootball360LiveResponse(await response.json());
    } finally {
      clearTimeout(timer);
    }
  } catch {}

  try {
    const guarded = await runWithApiFootballCircuit(() => getMatchesResilient({ live: "all" }));
    if (!guarded.skipped && !guarded.error) {
      const result = guarded.result;
      const matches = Array.isArray(result?.data) ? result.data : [];
      const liveMatches = annotateMatchesWithFootball360Signal(matches.filter(isActuallyLive).filter(isInLiveScope), football360Signal);
      if (liveMatches.length) {
        return NextResponse.json(
          { matches: liveMatches, source: result?.source || "api-football", broadcastSignal: football360Signal.length ? "football360" : null, checkedAt },
          { headers: liveHeaders() },
        );
      }
    }
  } catch {}

  try {
    const fallback = annotateMatchesWithFootball360Signal(await fallbackLiveMatches(), football360Signal);
    return NextResponse.json(
      { matches: fallback, source: "thesportsdb-live", broadcastSignal: football360Signal.length ? "football360" : null, checkedAt },
      { headers: liveHeaders() },
    );
  } catch {
    return NextResponse.json(
      { matches: [], source: "thesportsdb-live", checkedAt },
      { status: 200, headers: liveHeaders() },
    );
  }
}
