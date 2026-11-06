# B2 · Rules engine and verifier

**Track:** B · **Branch:** `phase/B2-rules-verifier` · **Depends on:** B1, P0 `EnsReader` mock · **Integration:** I2

## Goal

`@lanyard/rules`: one pure function, used by the app (on Hermes and in the browser) and by `lanyard verify` (on Node), that decides which Arkiv records count. Anyone can write anything to Arkiv; the rules decide what's real.

**Arkiv decides who can edit a record (its owner). ENS decides whether the record counts (the writer held the right badge at that moment).**

Built entirely against `MockEnsReader` and `fixtures/ens-history.json`. The real reader arrives at I2.

## Out of scope

Feature-specific rules for volunteers, tickets and judging. Those ship with their features in B3 and B4, plugged into the engine built here.

## How a record is judged

1. **Writer.** `$creator` and `$owner` match what the kind requires.
2. **Claimed badge.** The `by` attribute names an ENS label, e.g. `priya.volunteers`.
3. **Badge belonged to writer.** That name resolved to the writer's address **at the time the record was written**.
4. **Badge allowed it.** At that time the badge was unexpired, not unregistered, and carried any needed permission note.
5. **Kind-specific condition** (registered by B3/B4).

"At the time" means: Arkiv `$createdAt` block → that block's timestamp → `EnsReader.sepoliaBlockAt(timestamp)` → ENS reads at that Sepolia block.

Records that fail are kept and shown greyed out with a reason, never hidden.

---

### B2.1 · Time mapping

**Requirements**
- **B2.1-R1** THE package SHALL map an Arkiv block to its timestamp (cached), and a timestamp to a Sepolia block through `EnsReader.sepoliaBlockAt`.
- **B2.1-R2** WHEN a timestamp falls between two Sepolia blocks, THE mapping SHALL pick the earlier block.
- **B2.1-R3** THE mapping SHALL be an input to the rules, prepared outside them, so the rules stay pure.

**Commit:** `feat(rules): B2.1 arkiv-to-sepolia time mapping`

---

### B2.2 · Rules core

**Requirements**
- **B2.2-R1** THE rules SHALL be a pure function of (Arkiv records, a prepared ENS snapshot keyed by label and block, rule version), with no clocks, randomness or network calls inside.
- **B2.2-R2** THE engine SHALL apply steps 1–4 to every record, then call the kind's registered rule, returning `{ counts: boolean, reason?: string }` per record.
- **B2.2-R3** THE engine SHALL ship the organizer-only kinds now: `venue`, `seat_assignment` and `acceptance` count only if written by the organizer; `rubric` only if written by the organizer or by a partner for its own track; `results` only by the results key.
- **B2.2-R4** THE engine SHALL use integer arithmetic, stable sorting, and deterministic tie-breaks (earliest block, then lowest record key).
- **B2.2-R5** A `prepare(records, ensReader)` step SHALL collect every (label, block) the rules will need and fetch them in one deduplicated pass, so the pure step has everything.
- **B2.2-R6** THE package SHALL import nothing Node-only, so it runs unchanged on Hermes, in the browser and on Node.

**Tasks**
- [ ] Engine with a per-kind rule registry
- [ ] `prepare` step
- [ ] Organizer-only and results-key kinds
- [ ] Organizer screen (web-only) listing greyed records with reasons

**Commit:** `feat(rules): B2.2 pure rules engine with prepare step`

---

### B2.3 · Determinism and `lanyard verify`

**Requirements**
- **B2.3-R1** THE rule version SHALL be the hash of the bundled rules source, exported as `RULES_VERSION`.
- **B2.3-R2** WHEN the input order is shuffled 1,000 times, THE output SHALL not change.
- **B2.3-R3** WHEN `lanyard verify <event>` runs, THE CLI SHALL read the `results` record, fetch the same inputs at the recorded Arkiv and Sepolia blocks, recompute, and print `MATCH` or the first differing item.
- **B2.3-R4** WHEN any read fails, THE CLI SHALL exit non-zero, naming the failing read, and never print `MATCH`.
- **B2.3-R5** THE CLI SHALL verify 2,000 records in under a minute.
- **B2.3-R6** WHEN `lanyard hash <event> --arkiv-block N --sepolia-block M` runs, THE CLI SHALL print the rules output hash without needing a `results` record (used at I2 to compare machines before any freeze exists).
- **B2.3-R7** THE app SHALL be able to show the same output hash for given blocks, so a phone and a laptop can be compared.

**Commit:** `feat(cli): B2.3 RULES_VERSION, lanyard verify and lanyard hash`

---

## Phase bug hunt

- [ ] A record citing `by: ana.judges` written by a different wallet: rejected
- [ ] A record written one block before a badge's `unregister`: counts. One block after: rejected
- [ ] A badge unregistered, then the label re-registered to someone else: old records stay tied to the old owner
- [ ] A record at exactly a badge's expiry second: rejected
- [ ] A timestamp between two Sepolia blocks: the earlier block is used
- [ ] A `seat_assignment` written by a volunteer: rejected with a reason, still shown
- [ ] The same inputs on two laptops, and on the Android app: identical output hash
- [ ] Grep the rules package for `Date.now`, `Math.random`, `fetch` and Node built-ins: none
- [ ] 2,000 records: verify finishes in under a minute
- [ ] The mock RPC throws mid-verify: the CLI fails loudly

## Phase done when

- [ ] B2.1–B2.3 marked done in `TRACKER.md`
- [ ] Bug hunt run; Highs fixed with regression tests; Mediums fixed or in Known limitations
- [ ] Merged into `main`
