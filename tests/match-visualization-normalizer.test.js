const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildVisualizationFeed,
  eventSide,
  normalizeEvent,
  normalizeFixtureSummary,
} = require("../lib/match-visualization-normalizer.cjs");

const details = {
  fixture: { status: { short: "FT", elapsed: 90 } },
  teams: {
    home: { id: 10, name: "England" },
    away: { id: 20, name: "Spain" },
  },
  goals: { home: 2, away: 1 },
};

test("normalizes API-Football goal with team side and stoppage time", () => {
  const event = normalizeEvent({
    type: "Goal",
    time: { elapsed: 45, extra: 2 },
    team: { id: 10, name: "England" },
    player: { id: 99, name: "Harry Kane" },
    assist: { id: 88, name: "Foden" },
    detail: "Normal Goal",
  }, details, 0);

  assert.equal(event.type, "goal");
  assert.equal(event.side, "home");
  assert.equal(event.minuteLabel, "45+2'");
  assert.equal(event.player, "Harry Kane");
  assert.equal(event.assist, "Foden");
});

test("distinguishes yellow and red cards", () => {
  const yellow = normalizeEvent({
    type: "Card",
    time: { elapsed: 22 },
    team: { id: 20, name: "Spain" },
    player: { name: "Rodri" },
    detail: "Yellow Card",
  }, details, 1);
  const red = normalizeEvent({
    type: "Card",
    time: { elapsed: 35 },
    team: { id: 10, name: "England" },
    player: { name: "Walker" },
    detail: "Red Card",
  }, details, 2);

  assert.equal(yellow.red, false);
  assert.equal(yellow.icon, "🟨");
  assert.equal(red.red, true);
  assert.equal(red.icon, "🟥");
});

test("normalizes substitution and missed penalty", () => {
  const substitution = normalizeEvent({
    type: "subst",
    time: { elapsed: 57 },
    team: { id: 20, name: "Spain" },
    player: { name: "Yamal" },
    detail: "Substitution",
  }, details, 3);
  const missed = normalizeEvent({
    type: "Goal",
    time: { elapsed: 66 },
    team: { id: 20, name: "Spain" },
    player: { name: "Morata" },
    detail: "Missed Penalty",
  }, details, 4);

  assert.equal(substitution.type, "substitution");
  assert.equal(substitution.side, "away");
  assert.equal(missed.type, "shot");
  assert.equal(missed.icon, "🎯");
});

test("builds feed with kickoff, halftime and finished states", () => {
  const feed = buildVisualizationFeed([
    { type: "Goal", time: { elapsed: 10 }, team: { id: 10, name: "England" }, detail: "Normal Goal" },
  ], details);

  assert.deepEqual(feed.map((event) => event.type), ["kickoff", "goal", "halftime", "finished"]);
});

test("fixture summary maps terminal state and score without mutation", () => {
  const summary = normalizeFixtureSummary(details);
  assert.equal(summary.phase, "finished");
  assert.equal(summary.elapsed, 90);
  assert.deepEqual(summary.score, { home: 2, away: 1 });
  assert.deepEqual(details.goals, { home: 2, away: 1 });
});

test("explicit demo events remain supported but are not injected", () => {
  const demo = [{ type: "goal", minute: 12, team: "England", label: "گل انگلیس", icon: "⚽" }];
  const feed = buildVisualizationFeed(demo, details, true);
  assert.equal(feed.length, 1);
  assert.equal(feed[0].type, "goal");
});

test("eventSide returns empty for unrelated teams", () => {
  assert.equal(eventSide({ team: { id: 999, name: "France" } }, details), "");
});
