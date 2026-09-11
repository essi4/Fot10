import { NextResponse } from "next/server";
import { getMatchesResilient } from "../../../../lib/football-resilient";
import { getSportsDbLiveMatches } from "../../../../lib/thesportsdb-day";

export const dynamic = "force-dynamic";

function iranToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date())
    .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function GET() {
  try {
    const result = await getMatchesResilient({ live: "all" });
    const matches = Array.isArray(result?.data) ? result.data : [];
    if (matches.length) {
      return NextResponse.json({ matches, source: result?.source || "api-football" }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const fallback = await getSportsDbLiveMatches(iranToday());
    return NextResponse.json({ matches: fallback, source: fallback.length ? "thesportsdb-live" : "none" }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    try {
      const fallback = await getSportsDbLiveMatches(iranToday());
      return NextResponse.json({ matches: fallback, source: fallback.length ? "thesportsdb-live" : "none" }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    } catch {
      return NextResponse.json({ matches: [], source: "none" }, { status: 200 });
    }
  }
}
