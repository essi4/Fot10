import { NextResponse } from "next/server";
import { getMatchesResilient } from "../../../../lib/football-resilient";
import { getSportsDbLiveMatches } from "../../../../lib/thesportsdb-day";

export const dynamic = "force-dynamic";

function iranToday(offset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const base = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`);
  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
}

async function fallbackLiveMatches() {
  const dates = [iranToday(0), iranToday(-1), iranToday(1)];
  const batches = await Promise.allSettled(dates.map((date) => getSportsDbLiveMatches(date)));
  const byId = new Map();
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const match of batch.value || []) {
      if (match?.id) byId.set(String(match.id), match);
    }
  }
  return [...byId.values()];
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const result = await getMatchesResilient({ live: "all" });
    const matches = Array.isArray(result?.data) ? result.data : [];
    if (matches.length) {
      return NextResponse.json(
        { matches, source: result?.source || "api-football", checkedAt },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }
  } catch {}

  try {
    const fallback = await fallbackLiveMatches();
    return NextResponse.json(
      { matches: fallback, source: fallback.length ? "thesportsdb-live" : "none", checkedAt },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { matches: [], source: "none", checkedAt },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
