# FOT10 Match Visualization Specification

**Status:** Draft implementation contract  
**Scope:** FOT10 Match Visualization  
**Reference branch:** `feature/match-visualization-v2-event-feed`

## 1. Core Principle — Single Source of Truth

The Retro Pitch, Timeline, and Scoreboard are three views of the same canonical match-event model.

A match event must exist as one canonical record. The views must not invent independent copies of match facts.

**Hard rule:** no synthetic position, movement, trajectory, or event may be presented as real match data.

The FOT10 competition scope is:

- 10 selected club leagues
- Senior national-team matches only
- No U23/U21/U20/U19/U17 or other youth national competitions
- No unrelated club competitions

## 2. Data Architecture

```
REAL MATCH DATA / FEED PROVIDERS
              |
              v
       Event Normalizer
    (Canonical Event Schema)
              |
              v
         Event Model
       /      |       \
      v       v        v
 Scoreboard Timeline Retro Pitch
       \      |       /
              v
        LIVE / REPLAY
```

The normalizer converts provider-specific payloads into one stable internal representation.

## 3. CanonicalEvent

Conceptual schema:

```json
{
  "event_id": "provider-or-derived-unique-id",
  "match_id": "fixture-id",
  "event_type": "goal|yellow_card|red_card|substitution|var|penalty|missed_penalty|corner|shot",
  "timestamp": 1727520000,
  "game_clock": "67:00",
  "period": "first_half|second_half|extra_time|penalties",
  "acting_team": "ARG",
  "acting_player": "player_id",
  "target_player": "player_id",
  "coordinates": {
    "x": 82,
    "y": 44,
    "has_location": true
  },
  "raw_payload": {}
}
```

Fields may be null/omitted when the provider does not supply them.

### 3.1 Event identity and idempotency

- Every canonical event must have a stable `event_id`.
- Repeated upstream delivery must not create duplicate UI events.
- Provider event IDs should be preferred.
- A deterministic derived key may be used when a provider ID is unavailable.
- The event model must remain idempotent across polling refreshes.

## 4. Missing Location — Critical Rule

If the provider does not supply a trustworthy location:

```json
"coordinates": {
  "x": null,
  "y": null,
  "has_location": false
}
```

The event remains visible in Timeline and Scoreboard.

The Pitch must **not** place the event at midfield or another arbitrary coordinate.

Allowed Pitch behavior:

- no location marker, or
- a clearly labelled neutral state such as **«مکان نامعلوم» / Unknown location**

The UI must never imply that an unknown location is an actual location.

**No coordinates => no trajectory and no movement path.**

## 5. Retro Pitch — Visual Specification

The Pitch is a lightweight 2D / slightly-isometric Modern Retro renderer.

### Canvas

- Target aspect ratio: approximately 16:9
- Fully responsive, with mobile as the primary target
- Pixel/arcade visual language
- Limited palette
- Readable modern typography around the retro renderer

### Pitch elements

- Dark green pitch
- Cream/white pixel-style markings
- Two goals
- Penalty areas
- Centre circle
- Penalty spots
- Two clearly contrasting team colors
- Small player tokens rather than detailed avatars
- High-contrast ball
- Distinct goalkeeper treatment
- Minimal shadows/glow/scanline effects

The renderer is **not** intended to reproduce a full football video game.

Its purpose is to communicate:

1. what happened,
2. for which team,
3. approximately where it happened when trustworthy location data exists,
4. how the event relates to the current score.

## 6. Player Display Levels

### Normal state

Players appear as small colored tokens with restrained movement only when supported by valid data.

### Important event

For a goal, card, shot, VAR, etc.:

- related player/event is highlighted
- optional short name label appears
- visual emphasis is temporary

### Detail state

Selecting the Pitch event or Timeline event can expose:

- player
- event type
- minute
- location state
- assist, when available
- incoming/outgoing player for substitutions, when available

## 7. Supported MVP Events

Version 1 supports:

- Goal
- Yellow card
- Red card
- Substitution
- VAR
- Penalty
- Missed penalty
- Corner
- Shot, when available from the feed

Provider-specific event types must be normalized before rendering.

## 8. Event Queue

The renderer must process visual events sequentially.

The queue exists to coordinate closely related events, not to delay every event artificially.

Rules:

- Related events may be grouped for a short presentation window.
- Target visual duration is approximately 300–500 ms for simple event entry.
- Ball movement, when location data supports it, is approximately 700 ms.
- Goal sequence may use up to approximately 1.5 s.
- Card/substitution presentation is approximately 600 ms.
- Events must not visually overlap in a way that makes the sequence unreadable.
- Independent events should render promptly.
- The queue must never fabricate missing event data.

### Goal sequence

When trustworthy location data exists:

1. focus the relevant attacking area,
2. animate the ball from the event start position toward goal,
3. briefly emphasize the goal,
4. use a restrained pixel/touch effect,
5. show GOAL,
6. update Scoreboard and Timeline from the same canonical event.

If location data is unavailable, skip the spatial trajectory and show the event without inventing one.

## 9. Timeline ↔ Pitch Integration

The relationship is bidirectional.

### Timeline → Pitch

Selecting an event:

- selects the canonical event,
- switches to Replay context if appropriate,
- highlights the corresponding Pitch state,
- exposes the event details.

### Pitch → Timeline

Selecting a Pitch event:

- selects the same canonical event,
- scrolls/positions Timeline to that event,
- highlights the matching Timeline item.

No second independent event record may be created for either direction.

## 10. LIVE Mode

LIVE is driven only by current match data.

Rules:

- Polling/stream updates are normalized into CanonicalEvents.
- Duplicate provider events are ignored by event identity.
- Scoreboard, Timeline and Pitch consume the same updated model.
- No synthetic event is inserted into LIVE mode.
- If live data becomes stale, the UI must clearly indicate stale data and must not continue presenting fabricated live progression.

## 11. REPLAY Mode

REPLAY is an event review mode, not a full 90-minute game simulation.

The user can:

- select important events,
- jump between event timestamps,
- inspect event details,
- see the corresponding Pitch state when location data exists.

A compact event rail/timeline may show important moments as markers.

REPLAY must preserve the distinction between:

- real event data,
- known location,
- unknown location.

## 12. Demo/Test Data Isolation

Argentina vs Brazil and other sample matches may be used for UI/prototype testing.

Demo data must be explicitly marked and isolated.

Example:

```
?demo=1
```

or an equivalent test-only fixture source.

Demo data must:

- never be injected into LIVE mode,
- never be returned by production live endpoints,
- never be treated as provider data,
- never affect production scores/events,
- remain covered by automated tests.

## 13. Error and Incomplete-Feed States

The UI must gracefully handle:

- missing location,
- missing player,
- missing assist,
- missing score,
- delayed event feed,
- stale feed,
- provider errors,
- unavailable lineups.

Unknown data must be represented as unknown; it must not be guessed.

## 14. Visual Rules

Use a restrained Modern Retro palette:

- dark green: pitch
- cream/white: pitch markings
- red: LIVE
- yellow: yellow card
- red/dark red: red card
- blue/purple: VAR
- contrasting team colors for player tokens

Retro character should primarily come from:

- pixel framing,
- restrained animation,
- token/sprite language,
- arcade-style scoreboard treatment.

Avoid excessive CRT scanlines, glow, particles, or effects that reduce readability.

## 15. Responsive UX

Mobile is the primary target.

Recommended order:

1. Match header / Scoreboard
2. Modern Retro Pitch
3. LIVE/REPLAY control
4. Event Timeline
5. Event detail
6. Match statistics

The score and current event must remain immediately readable.

## 16. MVP Acceptance Criteria

The first implementation is successful when:

- Pitch, Timeline and Scoreboard use one canonical event model.
- Real events render without duplication.
- Goals/cards/substitutions/VAR/corners/penalties/shots can be represented.
- Known locations can be visualized.
- Unknown locations are never falsely positioned.
- Timeline ↔ Pitch navigation works in both directions.
- LIVE and REPLAY are clearly distinct.
- Event processing is sequential and readable.
- Demo/test data is isolated from LIVE.
- Mobile layout remains usable.
- Automated tests cover normalization, identity/idempotency, missing-location behavior and view synchronization.

## 17. Non-Goals for MVP

The first version does **not** attempt to simulate:

- continuous possession,
- every pass,
- continuous movement of every player,
- a complete 90-minute video-game simulation,
- invented player coordinates,
- invented ball trajectories,
- television/video replay.

These may only be considered later when trustworthy provider data supports them.

## 18. Implementation Sequence

1. Register this specification as the reference contract.
2. Define/extend CanonicalEvent.
3. Add unit tests for normalization and event identity.
4. Add tests for missing-location behavior.
5. Build the Modern Retro Pitch prototype using explicitly isolated demo/test data.
6. Connect Pitch, Timeline and Scoreboard to the same event model.
7. Implement Event Queue behavior.
8. Implement LIVE/REPLAY navigation.
9. Verify mobile responsiveness and accessibility/readability.
10. Run all CI gates.
11. Perform manual UI verification.
12. Only after final approval may the PR leave draft state or proceed toward merge/Production.

## 19. Release Gate

Until the complete technical and UI review is approved:

- do not merge to `main`,
- do not deploy Production,
- do not treat demo data as production data,
- do not bypass failed CI gates.

This document is the source of truth for the Match Visualization implementation and should be updated when an implementation decision intentionally changes the specification.
