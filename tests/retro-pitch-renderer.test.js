"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  selectRenderablePitchEvents,
  selectPitchLocationState,
} = require("../lib/retro-pitch-renderer.cjs");

const events = [
  {
    event_id: "located-goal",
    event_type: "goal",
    game_clock: "67:00",
    period: "second_half",
    acting_team: "ARG",
    acting_player: "9",
    coordinates: { x: 82, y: 44, has_location: true },
  },
  {
    event_id: "unknown-card",
    event_type: "yellow_card",
    game_clock: "70:00",
    period: "second_half",
    acting_team: "BRA",
    acting_player: "5",
    coordinates: { x: null, y: null, has_location: false },
  },
  {
    event_id: "invalid-shot",
    event_type: "shot",
    game_clock: "71:00",
    period: "second_half",
    acting_team: "ARG",
    acting_player: "10",
    coordinates: { x: 140, y: 44, has_location: true },
  },
];

test("retro pitch renders only valid located events", () => {
  const result = selectRenderablePitchEvents(events);

  assert.deepEqual(result.map((event) => event.event_id), ["located-goal"]);
  assert.equal(result[0].coordinates.x, 82);
  assert.equal(result[0].coordinates.y, 44);
});

test("unlocated events remain identifiable but receive no fallback position", () => {
  const state = selectPitchLocationState(events);

  assert.deepEqual(state.located_event_ids, ["located-goal"]);
  assert.deepEqual(state.unlocated_event_ids, ["unknown-card", "invalid-shot"]);
});

test("polling order does not change the pitch projection", () => {
  assert.deepEqual(
    selectRenderablePitchEvents(events),
    selectRenderablePitchEvents([...events].reverse()),
  );
});
