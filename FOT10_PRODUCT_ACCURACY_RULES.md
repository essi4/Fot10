# FOT10 — Product Accuracy & Minimal Broadcast Rules

## Product focus

FOT10 is a single-purpose football product:

> پخش مینیمال نوستالژیک مسابقات زنده

It presents live-match information in a late-1990s pixel/retro broadcast language. It is not a game, betting product, synthetic replay, or video rebroadcast.

## Live-source rule

1. Every match returned by the configured Football360 live signal source is eligible for the Minimal Broadcast view.
2. League, country, club, and national-team scope do not restrict Minimal Broadcast eligibility.
3. Match teams, score, status, minute, competition, lineups, and events must come from a verified received source.
4. A Football360 live signal may be used to identify a live broadcast candidate. It must not be described as an official Football360 video API unless that is independently verified.
5. When a provider fixture id exists, detailed events and lineups may be fetched from the football data provider.
6. When no provider fixture id exists, FOT10 may show only the verified live signal fields and must not invent missing details.

## Retro player rule

The player sprites are an illustrative broadcast layer inspired by late-1990s football-game aesthetics.

- They are not live player tracking.
- Their positions must never be presented as current real-world player coordinates.
- Shirt numbers may use received lineup numbers.
- No synthetic ball trajectory, possession, passing network, or tactical movement may be presented as factual data.

## Event-location rule

If an event has valid provider coordinates, it may appear as a real event marker.

If coordinates are missing or invalid:

- keep the event in the Timeline,
- do not create a fallback position,
- do not animate an invented trajectory.

## Stale-data rule

If fresh live data stops arriving, the UI must clearly indicate stale data and stop pretending that the match is progressing.

## UI rule

The application shell contains only the Minimal Broadcast experience.

No legacy:

- league directory,
- standings dashboard,
- national-team directory,
- favorites system,
- account/push/navigation dashboard

is part of the active product shell.

## Demo rule

Demo data exists only behind explicit `?demo=1` QA mode and must remain visibly marked.

## Release gate

- Main remains untouched until CI and manual mobile/RTL QA pass.
- Production remains untouched until explicit approval after the final gate.
