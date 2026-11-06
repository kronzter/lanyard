# B3 · Volunteers and help tickets

**Track:** B · **Branch:** `phase/B3-volunteers-tickets` · **Depends on:** B1–B2, P0 `StubRouter` + `venue.small.json` · **Integration:** I3

## Goal

Volunteers work only while on duty, and any authorised lead can start, extend or end a shift. Hackers raise help tickets from their seat; the best on-duty helper gets one, walks there, resolves it, and is offered the best next ticket from where they now stand.

Built against `StubRouter` and the small fixture venue. The real grid router and the Mumbai venue arrive at I3. The volunteer, lead and ticket screens are phone screens; the organizer screens are web-only.

## Out of scope

Making someone a lead (an ENS write: the A4.3 coordinator console; seeds use A2.2's script through fixtures). The venue editor (A3.1).

## How on-duty works

- **Badge (ENS):** `priya.volunteers.mumbai2026.lanyard.eth`, valid for the whole event.
- **Lead (ENS):** any volunteer whose `lanyard.perms` note includes `shift-manager`. There can be several leads at once.
- **Shift (Arkiv):** a lead writes `shift {volunteer, zone, starts_at, ends_at}`. Changes are new shifts with `supersedes`.
- **Clock (Arkiv):** `clock {volunteer, action}`, written by any lead, or by the volunteer within 60 minutes before their shift.
- **Duty pass (Arkiv):** written together with the clock-in, expiring exactly at shift end. Never extended: any lead writes a fresh one instead. Display only.

**On duty at T** = badge valid at T **and** (a `shift` covers T with no later valid `clock out`, **or** the latest valid `clock` before T is `in`).

---

### B3.1 · On-duty rules, shifts and clocks

**Requirements**
- **B3.1-R1** THE rules SHALL register the `shift`, `clock` and `duty_pass` kinds. For a lead's write: the writer holds a `volunteers` badge whose note at that time includes `shift-manager`. A self `clock` must be `in`, within 60 min before a shift for that volunteer, with no other open clock-in.
- **B3.1-R2** THE rules SHALL export `onDuty(volunteer, at, zone?)`.
- **B3.1-R3** WHEN a lead clocks a volunteer in, THE app SHALL write `clock in` and a new `duty_pass` in one batch (one wallet approval).
- **B3.1-R4** WHEN a volunteer taps "Start shift" within 60 min before a shift, THE app SHALL write a self `clock in`. Outside that window, it SHALL show "Ask a lead".
- **B3.1-R5** WHEN a shift is extended, THE lead SHALL write a new `shift` with `supersedes` and a new `duty_pass`; the old ones stay visible.
- **B3.1-R6** WHEN a lead enters a late clock-in with a stated time, THE app SHALL show both the stated time and the real block time.
- **B3.1-R7** THE volunteer screen SHALL show a live countdown from the newest valid `duty_pass`.

**Screens:** `/volunteer` (status, countdown, zone, next shift, Start shift) · `/lead` (volunteers by zone with status, clock in/out, extend, write shift).

**Tasks**
- [ ] Shift, clock and duty-pass rules; `onDuty` as the union of overlapping shifts
- [ ] Volunteer and lead screens
- [ ] Seed four leads, ten volunteers, two zones

**Commit:** `feat(rules): B3.1 on-duty rules with volunteer and lead screens`

---

### B3.2 · Help tickets

**Categories:** Wi-Fi, power, hardware, furniture, food, lost item, other → on-duty volunteers in that zone. **Medical or safety: not a ticket.** The app shows the staff phone number and the help-desk location instead.

**Flow**
1. **Raise.** The hacker writes `ticket {seat, category, status: open}`, with a 4 h expiry.
2. **See.** Eligible helpers see open tickets on `<VenueMap>`, ordered by `router.nextTicket` from their current position. A helper's position starts at their zone's `help-desk` POI when they clock in.
3. **Claim.** The helper writes `ticket_claim {ticket}`, with a 15 min expiry. **The earliest claim by block wins**, ties broken by lowest record key. Losers are offered their next ticket at once.
4. **Walk.** `router.path` from the helper's position to the seat.
5. **Resolve.** The helper writes a readonly `ticket_resolution`. The hacker can patch their ticket to `status: confirmed`.
6. **Next.** The resolved seat becomes the helper's position; offer `router.nextTicket` from there.
7. **Reopen.** A claim that expires with no resolution leaves the ticket open again.

**Score:** `walking_metres − α × minutes_waiting`, with α = 5. Lowest wins.

**Requirements**
- **B3.2-R1** THE rules SHALL register `ticket` (hacker badge; at most 3 open per hacker, older extras ignored), plus `ticket_claim` and `ticket_resolution` (the writer is on duty in the ticket's zone).
- **B3.2-R2** WHEN two helpers claim one ticket, THE rules SHALL award it to the earliest claim by block, ties broken by lowest key, identically on every device.
- **B3.2-R3** WHEN a claim expires without a resolution, THE ticket SHALL show as open again.
- **B3.2-R4** WHEN a helper resolves a ticket, THE app SHALL offer the router's next ticket and draw the path to it.
- **B3.2-R5** THE ticket form SHALL never ask for personal or medical details, and SHALL say so.
- **B3.2-R6** THE screens SHALL use only the `Router` interface and the `<VenueMap>` props, never a concrete router.
- **B3.2-R7** WHEN a helper clocks in, THE app SHALL set their position to their zone's `help-desk` POI.

**Commit:** `feat(rules): B3.2 help tickets with claim race and next-ticket offers`

---

### B3.3 · Seats and partner tickets

**Requirements**
- **B3.3-R1** THE organizer screen (web-only) SHALL write readonly `seat_assignment {hacker, seat}` records from a CSV, signed by the organizer's wallet, with seat IDs taken from the current venue.
- **B3.3-R2** WHEN a hacker raises a ticket, THE form SHALL prefill their assigned seat and allow overriding it by tapping the map.
- **B3.3-R3** WHEN the category is partner help (e.g. "Arkiv SDK", "ENS contracts"), THE rules SHALL let only holders of a valid `staff.<partner>.partners` badge (at claim time) claim and resolve it. Partner staff don't need shifts.
- **B3.3-R4** THE organizer screen SHALL publish a `venue.json` file as a readonly `venue` record (used at I3 with the real venue).
- **B3.3-R5** THE partner-help categories SHALL be generated from the `event.config.ts` partner list.

**Commit:** `feat(rules): B3.3 seat assignments, venue publish and partner tickets`

---

## Phase bug hunt

- [ ] A volunteer clocks themselves in 61 minutes early: rejected
- [ ] A non-lead clocks someone else in: rejected
- [ ] Two leads clock the same volunteer in within one block: one "on duty", no errors
- [ ] `clock out` with no prior `clock in`: harmless, ignored
- [ ] Overlapping shifts: on-duty is the union, no crash
- [ ] A lead's note removed at block N: their clock-ins before N count, those after N don't (mock history)
- [ ] A volunteer's badge revoked while on duty: their later claims are rejected
- [ ] Phone clock set wrong: no effect, block time is used
- [ ] Two helpers claim within the same block, on two Android phones: one winner on both
- [ ] A claim left unresolved for 15 min: the ticket reopens
- [ ] An off-duty volunteer claims: ignored
- [ ] A general volunteer claims a partner ticket: ignored
- [ ] A partner judge (not staff) claims a partner ticket: ignored
- [ ] A hacker raises 5 tickets: only 3 count
- [ ] A ticket from a seat in another zone: that zone's volunteers see it
- [ ] A helper who just clocked in sees tickets ordered from their zone's help desk
- [ ] The screens import nothing from `packages/venue`

## Phase done when

- [ ] B3.1–B3.3 marked done in `TRACKER.md`
- [ ] Bug hunt run; Highs fixed with regression tests; Mediums fixed or in Known limitations
- [ ] Merged into `main`
