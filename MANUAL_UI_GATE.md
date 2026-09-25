# FOT10 — Manual UI Gate

## Purpose
Manual acceptance gate for user-facing UI changes.

## Merge Rule
All P0 checks must be GREEN.

## P0 — Match Center
- [ ] Header is minimal
- [ ] Technical/monitoring text removed
- [ ] Yesterday/Today/Tomorrow work correctly
- [ ] Counts match displayed data
- [ ] Match Card is correct
- [ ] Finished matches are never shown as Live
- [ ] Live mode contains only truly live matches
- [ ] Empty Live state is correct
- [ ] No date leakage

## P0 — Responsive
- [ ] Mobile
- [ ] Tablet
- [ ] Desktop
- [ ] No horizontal overflow

## P0 — RTL
- [ ] Layout direction
- [ ] Team names
- [ ] Scores
- [ ] Icons/navigation
- [ ] Persian/Latin text

## P1 — UX
- [ ] Loading state
- [ ] Error state
- [ ] Match details navigation
- [ ] Browser back navigation
- [ ] Bottom navigation

## Evidence
- Preview URL:
- Commit SHA:
- Test run:
- Build run:
- Manual check date:
- Reviewer:

## Final Gate

Data:       [ ]
UI:         [ ]
Responsive: [ ]
RTL:        [ ]

Manual UI Gate: [ ]

Merge: [LOCKED]
Production: [LOCKED]
