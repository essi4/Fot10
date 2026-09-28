const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeFootball360LiveResponse,
  annotateMatchesWithFootball360Signal,
  sameMatch,
} = require("../lib/football360-live.cjs");

test("normalizes a Football360 live payload and keeps only FOT10 scope", () => {
  const payload = {
    data: [
      { id: "a", home: "Turkey", away: "Italy", status: "LIVE", league: "UEFA Nations League", score: { home: 1, away: 0 } },
      { id: "b", home: "Belgium", away: "France", status: "live", league: "UEFA Nations League" },
      { id: "c", home: "Belgium", away: "Ukraine", status: "live", league: "UEFA Nations League" },
      { id: "d", home: "France U21", away: "Belgium U21", status: "live", league: "UEFA Nations League" },
    ],
  };
  const matches = normalizeFootball360LiveResponse(payload);
  assert.deepEqual(matches.map((m) => [m.home, m.away]), [["Turkey", "Italy"], ["Belgium", "France"]]);
  assert.equal(matches[0].broadcastAvailable, true);
});

test("recognizes normalized Türkiye team names", () => {
  const payload = [{ home: "Türkiye", away: "Italy", status: "live", league: "UEFA Nations League" }];
  const matches = normalizeFootball360LiveResponse(payload);
  assert.equal(matches.length, 1);
});

test("annotates existing live matches without replacing their provider identity", () => {
  const existing = [{ id: 55, home: "France", away: "Belgium", source: "api-football" }];
  const signal = [{ id: "360-1", home: "Belgium", away: "France", broadcastAvailable: true, sourceMatchId: "360-1" }];
  const annotated = annotateMatchesWithFootball360Signal(existing, signal);
  assert.equal(annotated[0].id, 55);
  assert.equal(annotated[0].source, "api-football");
  assert.equal(annotated[0].broadcastAvailable, true);
  assert.equal(annotated[0].football360MatchId, "360-1");
});

test("matches are compared independent of home-away ordering", () => {
  assert.equal(sameMatch({ home: "Turkey", away: "Italy" }, { home: "Italy", away: "Turkey" }), true);
});
