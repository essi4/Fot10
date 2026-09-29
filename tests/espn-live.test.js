const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeEspnLiveResponse, isLiveEvent } = require("../lib/espn-live.cjs");

test("normalizes an ESPN international friendly that is in progress", () => {
  const payload = {
    events: [{
      id: "401911182",
      date: "2026-09-29T16:00:00Z",
      league: { name: "International Friendly" },
      competitions: [{
        competitors: [
          { homeAway: "home", score: "2", team: { id: "186", displayName: "Russia", logos: [{ href: "russia.png" }] } },
          { homeAway: "away", score: "0", team: { id: "66", displayName: "Iran", logos: [{ href: "iran.png" }] } },
        ],
        status: {
          displayClock: "67:00",
          type: { state: "in", name: "STATUS_IN_PROGRESS" },
        },
        venue: { fullName: "Ak Bars Arena" },
      }],
    }],
  };

  const [match] = normalizeEspnLiveResponse(payload);
  assert.ok(match);
  assert.equal(match.id, "espn-401911182");
  assert.equal(match.home, "Russia");
  assert.equal(match.away, "Iran");
  assert.equal(match.homeScore, 2);
  assert.equal(match.awayScore, 0);
  assert.equal(match.statusShort, "LIVE");
  assert.equal(match.sourceMatchId, null);
  assert.equal(match.broadcastSource, "espn-public");
});

test("does not treat pregame or finished ESPN events as live", () => {
  assert.equal(isLiveEvent({ competitions: [{ status: { type: { state: "pre", name: "STATUS_SCHEDULED" } } }] }), false);
  assert.equal(isLiveEvent({ competitions: [{ status: { type: { state: "post", name: "STATUS_FINAL" } } }] }), false);
  assert.equal(isLiveEvent({ competitions: [{ status: { type: { state: "in", name: "STATUS_IN_PROGRESS" } } }] }), true);
});
