"use strict";

/**
 * CanonicalEvent is the single event contract shared by Timeline,
 * Scoreboard and Retro Pitch.
 *
 * This module deliberately does not invent coordinates. A missing or
 * untrusted location is represented with has_location=false.
 */

const EVENT_TYPES = new Set([
  "goal",
  "yellow_card",
  "red_card",
  "substitution",
  "var",
  "penalty",
  "missed_penalty",
  "corner",
  "shot",
]);

const PERIODS = new Set([
  "first_half",
  "second_half",
  "extra_time",
  "penalties",
  "unknown",
]);

function stringOrNull(value) {
  return value == null || value === "" ? null : String(value);
}

function finiteNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCoordinates(value) {
  const x = finiteNumberOrNull(value?.x);
  const y = finiteNumberOrNull(value?.y);
  const hasLocation = value?.has_location === true &&
    x != null && y != null && x >= 0 && x <= 100 && y >= 0 && y <= 100;

  return {
    x: hasLocation ? x : null,
    y: hasLocation ? y : null,
    has_location: hasLocation,
  };
}

function derivePeriod(event, details) {
  const explicit = String(event?.period || "").toLowerCase();
  if (PERIODS.has(explicit)) return explicit;

  const minute = finiteNumberOrNull(event?.minute ?? event?.time?.elapsed);
  const status = String(details?.fixture?.status?.short || "").toUpperCase();

  if (status === "P") return "penalties";
  if (minute != null && minute > 90) return "extra_time";
  if (minute != null && minute > 45) return "second_half";
  if (minute != null) return "first_half";
  return "unknown";
}

function canonicalEventType(event) {
  const type = String(event?.event_type || event?.type || "").toLowerCase();
  const detail = String(event?.detail || "").toLowerCase();

  if (type === "card") {
    if (detail.includes("red") || detail.includes("second yellow") || detail.includes("second_yellow")) {
      return "red_card";
    }
    return "yellow_card";
  }

  if (type === "subst") return "substitution";
  if (type === "missed penalty") return "missed_penalty";
  return EVENT_TYPES.has(type) ? type : null;
}

function canonicalEventId(event, details, fallbackIndex = 0) {
  if (event?.event_id) return String(event.event_id);
  if (event?.id != null) return String(event.id);

  const matchId = details?.fixture?.id ?? details?.id ?? "unknown-match";
  const minute = event?.minute ?? event?.time?.elapsed ?? "unknown-minute";
  const team = event?.team?.id ?? event?.team?.name ?? event?.team ?? "unknown-team";
  const player = event?.player?.id ?? event?.player?.name ?? event?.player ?? "unknown-player";
  const type = canonicalEventType(event) || "unknown";
  const detail = event?.detail || event?.label || "";

  return [matchId, type, minute, team, player, detail, fallbackIndex].join("|");
}

function toCanonicalEvent(event, details = null, fallbackIndex = 0) {
  const eventType = canonicalEventType(event);
  if (!eventType) return null;

  const minute = finiteNumberOrNull(event?.game_clock?.split?.(":")?.[0] ?? event?.minute ?? event?.time?.elapsed);
  const timestamp = finiteNumberOrNull(event?.timestamp ?? event?.time?.timestamp);

  const team = event?.acting_team ?? event?.team?.id ?? event?.team?.name ?? event?.team;
  const player = event?.acting_player ?? event?.player?.id ?? event?.player?.name ?? event?.player;
  const target = event?.target_player ?? event?.assist?.id ?? event?.assist?.name;

  const coordinates = normalizeCoordinates(event?.coordinates);

  return {
    event_id: canonicalEventId(event, details, fallbackIndex),
    match_id: stringOrNull(event?.match_id ?? details?.fixture?.id ?? details?.id),
    event_type: eventType,
    timestamp,
    game_clock: stringOrNull(event?.game_clock ?? (minute != null ? `${minute}:00` : null)),
    period: derivePeriod(event, details),
    acting_team: stringOrNull(team),
    acting_player: stringOrNull(player),
    target_player: stringOrNull(target),
    coordinates,
    raw_payload: event?.raw_payload ?? event,
  };
}

function dedupeCanonicalEvents(events = []) {
  const seen = new Set();
  return events.filter((event) => {
    if (!event?.event_id || seen.has(event.event_id)) return false;
    seen.add(event.event_id);
    return true;
  });
}

module.exports = {
  EVENT_TYPES,
  PERIODS,
  canonicalEventType,
  canonicalEventId,
  toCanonicalEvent,
  dedupeCanonicalEvents,
};
