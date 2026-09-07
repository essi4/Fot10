import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const live = searchParams.get("live") === "true";
  const league = searchParams.get("league") || undefined;
  const season = searchParams.get("season") || undefined;

  if (!live && !date) {
    return NextResponse.json({ ok: false, error: "date is required unless live=true" }, { status: 400 });
  }

  try {
    const matches = await getMatches({ date, live, league, season });
    return NextResponse.json({ ok: true, provider: "api-football", count: matches.length, matches });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Sports API request failed" }, { status: 502 });
  }
}
