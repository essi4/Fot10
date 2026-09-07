import { NextResponse } from "next/server";
import {
  getFixtureDetails,
  getFixtureEvents,
  getFixtureStatistics,
  getFixtureLineups,
  getFixturePlayers,
} from "../../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const section = searchParams.get("section") || "details";

  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  try {
    const fixtureId = Number(id);
    if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
      return NextResponse.json({ ok: false, error: "invalid fixture id" }, { status: 400 });
    }

    const loaders = {
      details: () => getFixtureDetails(fixtureId),
      events: () => getFixtureEvents(fixtureId),
      statistics: () => getFixtureStatistics(fixtureId),
      lineups: () => getFixtureLineups(fixtureId),
      players: () => getFixturePlayers(fixtureId),
    };

    const load = loaders[section];
    if (!load) {
      return NextResponse.json({ ok: false, error: "unsupported section" }, { status: 400 });
    }

    const data = await load();
    return NextResponse.json({ ok: true, provider: "api-football", fixtureId, section, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Fixture request failed" },
      { status: 502 }
    );
  }
}
