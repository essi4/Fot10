import { NextResponse } from "next/server";
import { getMatchesResilient } from "../../../../lib/football-resilient";

export const dynamic = "force-dynamic";

const LIVE = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const result = await getMatchesResilient({ live: "all" });
    const matches = Array.isArray(result?.data) ? result.data : [];
    const liveCount = matches.filter((m) => LIVE.has(String(m?.statusShort || "").toUpperCase())).length;
    return NextResponse.json({ ok: true, source: result?.source || "none", fallback: Boolean(result?.fallback), liveCount, checkedAt }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ ok: false, source: "none", fallback: false, liveCount: 0, checkedAt }, { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
