"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  selectTimelineEvents,
  selectScoreboardState,
  selectPitchEvents,
} = require("../lib/ui-event-model.cjs");

const events = [
  {
    event_id: "goal-1",
    event_type: "goal",
    timestamp: 100,
    game_clock: "10:00",
    period: "first_half",
    acting_team: "ARG",
    acting_player: "9",
    target_player: null,
    coordinates: { x: 82, y: 44, has_location: true },
    raw_payload: { detail: "Goal" },
  },
  {
    event_id: "card-1",
    event_type: "yellow_card",
    timestamp: 200,
    game_clock: "20:00",
    period: "first_half",
    acting_team: "BRA",
    acting_player: "5",
    target_player: null,
    coordinates: { x: null, y: null, has_location: false },
    raw_payload: { detail: "Yellow Card" },
  },
  {
    event_id: "miss-1",
    event_type: "missed_penalty",
    timestamp: 300,
    game_clock: "30:00",
    period: "first_half",
    acting_team: "ARG",
    acting_player: "9",
    target_player: null,
    coordinates: { x: null, y: null, has_location: false },
    raw_payload: { detail: "Missed Penalty" },
  },
];

test("all selectors project only canonical events", () => {
  const timeline = selectTimelineEvents(events);
  const scoreboard = selectScoreboardState(events);
  const pitch = selectPitchEvents(events);

  assert.deepEqual(timeline.map((event) => event.event_id), ["goal-1", "card-1", "miss-1"]);
  assert.equal(scoreboard.goal_count, 1);
  assert.equal(scoreboard.last_goal.event_id, "goal-1");
  assert.deepEqual(pitch.map((event) => event.event_type), ["goal", "yellow_card", "missed_penalty"]);
  assert.equal(pitch[1].coordinates.has_location, false);
});

test("selector outputs are stable across polling order changes", () => {
  const reversed = [...events].reverse();

  assert.deepEqual(selectTimelineEvents(events), selectTimelineEvents(reversed));
  assert.deepEqual(selectScoreboardState(events), selectScoreboardState(reversed));
  assert.deepEqual(selectPitchEvents(events), selectPitchEvents(reversed));
});

test("selectors preserve canonical semantics without reinterpretation", () => {
  const timeline = selectTimelineEvents(events);
  const missed = timeline.find((event) => event.event_id === "miss-1");

  assert.equal(missed.event_type, "missed_penalty");
  assert.equal(missed.target_player, null);
  assert.equal(missed.raw_payload.detail, "Missed Penalty");
});
