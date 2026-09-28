const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canonicalEventType,
  canonicalEventId,
  toCanonicalEvent,
  dedupeCanonicalEvents,
} = require("../lib/canonical-event.cjs");

const details = {
  fixture: { id: 12345, status: { short: "2H", elapsed: 67 } },
};

test("builds a canonical goal event with one stable identity", () => {
  const event = toCanonicalEvent({
    id: 9001,
    type: "Goal",
    time: { elapsed: 67 },
    team: { id: 10, name: "Argentina" },
    player: { id: 99, name: "Messi" },
    assist: { id: 88, name: "Di Maria" },
    detail: "Normal Goal",
  }, details);

  assert.equal(event.event_id, "9001");
  assert.equal(event.match_id, "12345");
  assert.equal(event.event_type, "goal");
  assert.equal(event.game_clock, "67:00");
  assert.equal(event.period, "second_half");
  assert.equal(event.acting_team, "10");
  assert.equal(event.acting_player, "99");
  assert.equal(event.target_player, "88");
  assert.equal(event.coordinates.has_location, false);
});

test("normalizes card semantics into yellow_card and red_card", () => {
  assert.equal(canonicalEventType({ type: "Card", detail: "Yellow Card" }), "yellow_card");
  assert.equal(canonicalEventType({ type: "Card", detail: "Red Card" }), "red_card");
  assert.equal(canonicalEventType({ type: "Card", detail: "Second Yellow" }), "red_card");
});

test("unknown location never becomes a fake pitch coordinate", () => {
  const event = toCanonicalEvent({
    type: "Goal",
    time: { elapsed: 12 },
    team: { id: 10 },
    coordinates: { x: 50, y: 50, has_location: false },
  }, details);

  assert.deepEqual(event.coordinates, {
    x: null,
    y: null,
    has_location: false,
  });
});

test("valid coordinates are retained only inside the normalized pitch range", () => {
  const event = toCanonicalEvent({
    type: "Shot",
    time: { elapsed: 33 },
    team: { id: 10 },
    coordinates: { x: 82, y: 44, has_location: true },
  }, details);

  assert.deepEqual(event.coordinates, {
    x: 82,
    y: 44,
    has_location: true,
  });
});

test("event identity is deterministic when provider id is unavailable", () => {
  const input = {
    type: "Goal",
    time: { elapsed: 20 },
    team: { id: 10 },
    player: { id: 99 },
    detail: "Normal Goal",
  };
  assert.equal(canonicalEventId(input, details, 0), canonicalEventId(input, details, 0));
  assert.notEqual(canonicalEventId(input, details, 0), canonicalEventId(input, details, 1));
});

test("duplicate upstream events are idempotent", () => {
  const event = toCanonicalEvent({
    id: 9002,
    type: "Shot",
    time: { elapsed: 31 },
    team: { id: 10 },
  }, details);

  assert.equal(dedupeCanonicalEvents([event, { ...event }]).length, 1);
});

test("unsupported provider events do not enter the canonical model", () => {
  assert.equal(toCanonicalEvent({ type: "SomethingUnknown", time: { elapsed: 10 } }, details), null);
});

test("missed penalty maps to missed_penalty and assist is not target_player", () => {
  const event = toCanonicalEvent({ type: "Goal", detail: "Missed Penalty", minute: 61, team: { id: 7, name: "Argentina" }, player: { id: 9, name: "Player" }, assist: { id: 10, name: "Assist" } }, { fixture: { id: 99, status: { short: "2H" } } });
  assert.equal(event.event_type, "missed_penalty");
  assert.equal(event.target_player, null);
});
