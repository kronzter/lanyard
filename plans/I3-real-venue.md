# I3 · Real venue and router

**Joint integration** · **Branch:** `int/I3-real-venue` · **Starts when:** A3 and B3 are both merged · **Driver:** A

This doesn't block A4 or B4.

## Goal

B3's volunteer and ticket screens run on the real Mumbai venue and the real `GridRouter`, with the venue published on Arkiv through B's writer.

## What gets swapped

| Before | After |
| --- | --- |
| `EXPO_PUBLIC_LANYARD_ROUTER=stub` | `EXPO_PUBLIC_LANYARD_ROUTER=grid` |
| `fixtures/venue.small.json` | `fixtures/venue.mumbai.json` (A3.1), published as a readonly `venue` record (B3.3) |
| Seat assignments for small-venue seat IDs | Regenerated for Mumbai seat IDs |
| Stub `<VenueMap>` | Real `<VenueMap>` (A3.3), same props |

## Steps (one commit each)

1. `chore(fixtures): I3 publish mumbai venue to rabdi and record its key`
2. `chore(fixtures): I3 regenerate seat assignments for mumbai seat ids`
3. `feat(app): I3 default router flag to grid`
4. `test(e2e): I3 two-phone ticket race on the mumbai venue`
5. `test(e2e): I3 resolve then next ticket follows real walls`

Build a fresh preview APK for both phones with `eas build --platform android --profile preview --local`.

## Smoke test (two Android phones)

1. A hacker (Person A of team `zkpay`) raises a Wi-Fi ticket from seat S014.
2. Two on-duty volunteers in that zone claim within the same few seconds: exactly one wins on both phones, and the loser is offered another ticket.
3. The winner walks the drawn path: it follows the aisles and never crosses a blocked cell.
4. Resolve. The next ticket is offered from S014, and its path is drawn.
5. A partner-help ticket ("Arkiv SDK") is visible only to holders of `staff.arkiv.partners` badges.

## Cross bug hunt

**A attacks B's code:**
- [ ] Raise a ticket from a seat that's in the venue but has no seat assignment: handled gracefully
- [ ] Volunteer zone names in shifts that don't exist in the real venue: flagged, no crash
- [ ] Rapid claim/unclaim on a slow network with wallet app switches: no double "on my way"

**B attacks A's code:**
- [ ] The published venue record round-trips to the identical `venue.json` (hash compare)
- [ ] The venue record is under 128 KiB
- [ ] Tap every seat on a rotated, zoomed phone: the correct seat each time
- [ ] An unreachable seat in the real venue: the router returns `null`, and the screen says "no walking route"

**Re-run the riskiest items from the A3 and B3 phase bug hunts.**

Findings go in `TRACKER.md › I3`.

## Done when

- [ ] The two-phone smoke test passes
- [ ] Highs fixed (on the owner's `fix/` branch); Mediums fixed or in Known limitations
- [ ] I3 marked done in `TRACKER.md`; merged into `main`
