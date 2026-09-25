import { NextResponse } from "next/server";
import { getMatchesResilient } from "../../../../lib/football-resilient";
import { getSportsDbLiveMatches } from "../../../../lib/thesportsdb-day";
import { runWithApiFootballCircuit } from "../../../../lib/api-football-circuit";
import { projectDate } from "../../../../lib/project-date";

export const dynamic = "force-dynamic";

const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const LIVE_CACHE_SECONDS = 15;
const LIVE_STALE_SECONDS = 15;

const LIVE_COUNTRIES = new Set([
  "iran", "ایران", "spain", "اسپانیا", "england", "انگلیس", "italy", "ایتالیا", "france", "فرانسه",
  "germany", "آلمان", "netherlands", "هلند", "turkey", "ترکیه", "saudi arabia", "عربستان سعودی",
  "qatar", "قطر", "portugal", "پرتغال", "belgium", "بلژیک", "austria", "اتریش", "denmark", "دانمارک",
  "scotland", "اسکاتلند", "czech republic", "جمهوری چک", "sweden", "سوئد", "croatia", "کرواسی", "greece", "یونان",
]);
const LIVE_LEAGUES = new Set([
  "uefa champions league", "afc champions league", "afc champions league elite", "afc champions league two",
  "champions league", "لیگ قهرمانان اروپا", "لیگ قهرمانان آسیا",
]);

function liveHeaders() {
  return { "Cache-Control": `public, s-maxage=${LIVE_CACHE_SECONDS}, stale-while-revalidate=${LIVE_STALE_SECONDS}` };
}

function isActuallyLive(match) {
  const status = String(match?.statusShort || match?.status || "").trim().toUpperCase();
  return LIVE_CODES.has(status) || /LIVE|IN PLAY|HALF/i.test(status);
}

function normalizeScope(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isInLiveScope(match) {
  const country = normalizeScope(match?.country);
  const league = normalizeScope(match?.league);
  return LIVE_COUNTRIES.has(country) || LIVE_LEAGUES.has(league) || /champions league|لیگ قهرمانان/i.test(league);
}

async function fallbackLiveMatches() {
  const dates = [projectDate(0), projectDate(-1), projectDate(1)];
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
