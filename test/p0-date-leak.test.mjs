import test from "node:test";
import assert from "node:assert/strict";
import { reconcileMatchGames } from "../lib/match-state.mjs";

test("clears previous-day games when the new day returns empty", () => {
  const previous = [{ id: 101, home: "Day A", away: "Day B" }];
  const result = reconcileMatchGames({
    currentKey: "day:2026-09-25",
    previousKey: "day:2026-09-24",
    previousGames: previous,
    incomingGames: [],
  });
  assert.deepEqual(result.games, []);
  assert.equal(result.lastGoodKey, null);
});

test("preserves valid games for the same day during a transient empty response", () => {
  const previous = [{ id: 101, home: "Day A", away: "Day B" }];
  const result = reconcileMatchGames({
    currentKey: "day:2026-09-24",
    previousKey: "day:2026-09-24",
    previousGames: previous,
    incomingGames: [],
  });
  assert.deepEqual(result.games, previous);
  assert.equal(result.lastGoodKey, "day:2026-09-24");
});

test("replaces the state when the current day returns usable data", () => {
  const result = reconcileMatchGames({
    currentKey: "day:2026-09-25",
    previousKey: "day:2026-09-24",
    previousGames: [{ id: 101 }],
    incomingGames: [{ id: 202 }],
  });
  assert.deepEqual(result.games, [{ id: 202 }]);
  assert.equal(result.lastGoodKey, "day:2026-09-25");
});
