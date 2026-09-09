import { NextResponse } from "next/server";
import { getMatchesResilient } from "../../../../lib/football-resilient";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getMatchesResilient({ live: "all" });
    const matches = Array.isArray(result?.data) ? result.data : [];
    return NextResponse.json({ matches, source: result?.source || "none" }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ matches: [], source: "none" }, { status: 200 });
  }
}
