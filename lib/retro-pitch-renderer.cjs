"use strict";

/**
 * Pure projection for the Modern Retro Pitch.
 * No raw-provider normalization and no invented coordinates.
 */

function selectRenderablePitchEvents(canonicalEvents = []) {
  return canonicalEvents
    .filter((event) => (
      event &&
      event.coordinates?.has_location === true &&
      Number.isFinite(Number(event.coordinates.x)) &&
      Number.isFinite(Number(event.coordinates.y)) &&
      Number(event.coordinates.x) >= 0 &&
      Number(event.coordinates.x) <= 100 &&
      Number(event.coordinates.y) >= 0 &&
      Number(event.coordinates.y) <= 100
    ))
    .map((event) => ({
      event_id: event.event_id,
      event_type: event.event_type,
      game_clock: event.game_clock,
      period: event.period,
      acting_team: event.acting_team,
      acting_player: event.acting_player,
      coordinates: {
        x: Number(event.coordinates.x),
        y: Number(event.coordinates.y),
        has_location: true,
      },
    }));
}

function selectPitchLocationState(canonicalEvents = []) {
  const renderable = selectRenderablePitchEvents(canonicalEvents);
  const locatedIds = new Set(renderable.map((event) => event.event_id));

  return {
    events: renderable,
    located_event_ids: [...locatedIds],
    unlocated_event_ids: canonicalEvents
      .filter((event) => event?.event_id && !locatedIds.has(event.event_id))
      .map((event) => event.event_id),
  };
}

module.exports = {
  selectRenderablePitchEvents,
  selectPitchLocationState,
};
