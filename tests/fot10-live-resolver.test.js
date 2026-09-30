const test = require("node:test");
const assert = require("node:assert/strict");
const { categoryOf, importanceScore, mergeLiveMatches } = require("../lib/fot10-live-resolver.cjs");

test("classifies major domestic leagues as league", () => {
  assert.equal(categoryOf({ league: "Premier League", leagueType: "League" }), "league");
  assert.equal(categoryOf({ league: "Liga Portugal", leagueType: "League" }), "league");
  assert.equal(categoryOf({ league: "Persian Gulf Pro League", leagueType: "League" }), "league");
});

test("classifies cups and national competitions separately", () => {
  assert.equal(categoryOf({ league: "UEFA Champions League", leagueType: "Cup" }), "cup");
  assert.equal(categoryOf({ league: "UEFA Nations League" }), "international");
  assert.equal(categoryOf({ league: "International Friendly" }), "international");
});

test("Iran and major competitions raise deterministic priority", () => {
  const iranMatch = { home: "Iran", away: "Russia", league: "International Friendly" };
  const genericMatch = { home: "Japan", away: "Mexico", league: "International Friendly" };
  assert.ok(importanceScore(iranMatch) > importanceScore(genericMatch));
});

test("merges provider matches and keeps Football360 broadcast signal", () => {
  const matches = mergeLiveMatches({
    apiFootball: [{ id: 101, home: "England", away: "Spain", league: "Premier League", leagueType: "League", statusShort: "LIVE", homeScore: 1, awayScore: 0 }],
    football360: [{ id: "360-1", home: "Spain", away: "England", statusShort: "LIVE", league: "Premier League", broadcastAvailable: true, sourceMatchId: "360-1" }],
  });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, "101");
  assert.equal(matches[0].provider, "api-football");
  assert.equal(matches[0].broadcastAvailable, true);
  assert.equal(matches[0].broadcastSource, "football360");
  assert.equal(matches[0].category, "league");
});