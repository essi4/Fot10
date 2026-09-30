"use strict";

/**
 * UI selectors are projections of CanonicalEvent only.
 * They must never re-normalize raw provider payloads or reinterpret event semantics.
 */

function sortEvents(events = []) {
  return [...events].sort((a, b) => {
    const ta = Number.isFinite(Number(a?.timestamp)) ? Number(a.timestamp) : Number.MAX_SAFE_INTEGER;
    const tb = Number.isFinite(Number(b?.timestamp)) ? Number(b.timestamp) : Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return String(a?.event_id || "").localeCompare(String(b?.event_id || ""));
  });
}

function selectTimelineEvents(canonicalEvents = []) {
  return sortEvents(canonicalEvents).map((event) => ({
    event_id: event.event_id,
    event_type: event.event_type,
    game_clock: event.game_clock,
    period: event.period,
    acting_team: event.acting_team,
    acting_player: event.acting_player,
    target_player: event.target_player,
    coordinates: event.coordinates,
    raw_payload: event.raw_payload,
  }));
}

function selectScoreboardState(canonicalEvents = []) {
  const goals = sortEvents(canonicalEvents).filter((event) => event.event_type === "goal");
  return {
    goal_event_ids: goals.map((event) => event.event_id),
    goal_count: goals.length,
    last_goal: goals.length ? goals[goals.length - 1] : null,
  };
}

function selectPitchEvents(canonicalEvents = []) {
  const pitchTypes = new Set([
    "goal", "yellow_card", "red_card", "substitution",
    "var", "penalty", "missed_penalty", "corner", "shot",
  ]);

  return sortEvents(canonicalEvents)
    .filter((event) => pitchTypes.has(event.event_type))
    .map((event) => ({
      event_id: event.event_id,
      event_type: event.event_type,
      game_clock: event.game_clock,
      period: event.period,
      acting_team: event.acting_team,
      acting_player: event.acting_player,
      target_player: event.target_player,
      coordinates: event.coordinates,
    }));
}

module.exports = {
  selectTimelineEvents,
  selectScoreboardState,
  selectPitchEvents,
};
