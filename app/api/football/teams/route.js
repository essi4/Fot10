import { NextResponse } from "next/server";
import { getTeamById, getTeamBySearch } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const id = searchParams.get("id") || undefined;
  if (!search && !id) return NextResponse.json({ ok: false, error: "search or id is required" }, { status: 400 });
  try {
    const team = id ? await getTeamById(id) : await getTeamBySearch(search);
    if (!team) return NextResponse.json({ ok: false, error: "Team not found" }, { status: 404 });
    return NextResponse.json({ ok: true, team: team.team || team, venue: team.venue || null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Team request failed" }, { status: 502 });
  }
}
