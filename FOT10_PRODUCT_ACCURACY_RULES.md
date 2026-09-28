# FOT10 — Product Accuracy & Match Visualization Rules

## Product focus

FOT10 is a football match information product. Its primary visual experience is:

> نمایش زنده اتفاقات بازی  
> زمین مینیمال مسابقه، رویدادهای واقعی و جزئیات ظریف 8-bit؛ بدون داده ساختگی.

The 8-bit / retro treatment is visual language only. FOT10 is not a game, betting product, simulation, or synthetic match replay.

## Non-negotiable data rules

1. Match scores, status, minute, teams, league, venue, and events must come from a verified football data source.
2. Never invent a match, score, event, player position, ball position, timestamp, comment count, or coordinate.
3. If event coordinates are unavailable or invalid, show the event in the timeline only and do not place a marker on the pitch.
4. If fresh live data is unavailable, stop live presentation rather than fabricating or extrapolating state.
5. Demo data may exist only behind an explicit developer/QA gate and must be visibly identified as DEMO.
6. Empty states must explain that real match/event data is currently unavailable.
7. Derived labels and formatting are allowed only when based on received source data; they must not create new factual claims.

## Visual rules

- Pitch ratio: 16:9.
- Pitch is minimal and readable.
- Real event markers only when canonical coordinates are valid.
- 8-bit details are limited to UI treatment, icons, timeline details, and subtle effects.
- No artificial ball movement, player movement, possession simulation, or gameplay controls.
- Visual polish must never imply data that the source did not provide.

## Information hierarchy

1. Live/actual match state.
2. Real match events and timeline.
3. Minimal pitch/event map.
4. Match metadata.
5. Selected leagues, results, and favorites as supporting navigation.

## Navigation language

Use:
- خانه
- لیگ‌ها
- نتایج زنده
- علاقه‌مندی

Do not expose internal developer flags such as `viz=1` to ordinary users.

## Gate policy

Before merge:
- CI must be green.
- Preview must be available.
- Mobile/RTL UX must be checked.
- No synthetic-data regression.
- User approval is required.

Main and Production remain untouched until all gates pass.
