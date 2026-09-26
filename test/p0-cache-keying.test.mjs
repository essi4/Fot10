import test from "node:test";
import assert from "node:assert/strict";

process.env.THESPORTSDB_PREMIUM_API_KEY = "";

const requested = [];
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  const date = url.searchParams.get("d");
  requested.push(date);

  await new Promise((resolve) => setTimeout(resolve, date === "2026-09-24" ? 20 : 0));

  return {
    ok: true,
    async json() {
      return {
        events: [{
          idEvent: date === "2026-09-24" ? "24001" : "25001",
          strSport: "Soccer",
          strStatus: "1H",
          strLeague: "Test League",
          strCountry: "Iran",
          strHomeTeam: "Home " + date,
          strAwayTeam: "Away " + date,
          dateEvent: date,
          strTime: "18:00:00",
          intProgress: "10",
          intHomeScore: "1",
          intAwayScore: "0",
        }],
      };
    },
  };
};

const { getSportsDbLiveMatches } = await import("../lib/thesportsdb-day.js");

test("isolates concurrent live cache entries by requested date", async () => {
  const [yesterday, today] = await Promise.all([
    getSportsDbLiveMatches("2026-09-24"),
    getSportsDbLiveMatches("2026-09-25"),
  ]);

  assert.deepEqual(yesterday.map((match) => match.id), [24001]);
  assert.deepEqual(today.map((match) => match.id), [25001]);
  assert.deepEqual([...requested].sort(), ["2026-09-24", "2026-09-25"]);
});

test("does not reuse yesterday's cached live data for another date", async () => {
  const tomorrow = await getSportsDbLiveMatches("2026-09-26");
  assert.deepEqual(tomorrow.map((match) => match.id), []);
});
