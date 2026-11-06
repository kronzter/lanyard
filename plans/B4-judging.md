# B4 · Judging and freeze

**Track:** B · **Branch:** `phase/B4-judging` · **Depends on:** B1–B3, P0 `MockResultsPublisher` + `StubRouter` · **Integration:** I4

## Goal

Partners judge their own tracks, teams own their submissions, scores stay hidden until freeze, and anyone can recompute the results. The freeze CLI calls `ResultsPublisher` so winners get `winner.<team>.<edition>.<base>` (mocked until I4).

## Out of scope

The winner-name contract and the resolver lock (A4). Issuing partner judges (A4.3 console; seeds use the A2.2 scripts). **Prize rules are TBD** (`00-CONTEXT.md` §14): until they're decided, the freeze takes the winning teams and their prize strings from `fixtures/prizes.json`.

---

### B4.1 · Projects, submissions, acceptance, assignments

**Flow:** the team lead writes `project` (creator and owner = the team lead's address) → the team lead writes **one** readonly `submission`, with `permissionlessExtension`, before the deadline block → the organizer writes readonly `acceptance {project, track}` (decides who's in, never what was submitted) → the organizer or partner writes `judge_assignment`.

**Requirements**
- **B4.1-R1** WHEN a submission is written after the deadline block, THE rules SHALL mark it late and exclude it.
- **B4.1-R2** WHEN anyone but the team lead (the team name's owner at that time) writes a submission, THE rules SHALL reject it.
- **B4.1-R3** WHEN a team writes more than one submission, THE rules SHALL count only the earliest valid one before the deadline, and show the others as duplicates.
- **B4.1-R4** WHEN the organizer tries to patch a team's project, THE write SHALL fail, because only the owner can patch.
- **B4.1-R5** THE team screen SHALL show the creator, owner and block for the project and the submission, and SHALL disable "Submit" once a valid submission exists.
- **B4.1-R6** THE rules SHALL accept a `judge_assignment` from the organizer, or from a partner for its own track only.
- **B4.1-R7** THE team screen SHALL render the winner badge through `providers.winnerBadge`, a no-op component until I4 wires in A4.3's `<WinnerBadge>`.

**Commit:** `feat(rules): B4.1 projects, single submission, acceptance and assignments`

---

### B4.2 · Judge flow

**Requirements**
- **B4.2-R1** THE judge screen SHALL order assigned projects with `router.judgeRoute` from the judge's start point; a project's location is its team lead's seat.
- **B4.2-R2** THE judge SHALL edit a `score_sheet` draft (autosaved) and seal a readonly `final_score`.
- **B4.2-R3** THE score payloads SHALL be encrypted to the event public key (from `event.config.ts`) on the device before writing, so they're ciphertext on Arkiv until freeze. The private key exists only in the freeze CLI operator's local `.env`.
- **B4.2-R4** WHEN a judge or the organizer writes a `recusal`, THE rules SHALL ignore that judge's scores for that project.
- **B4.2-R5** WHEN a judge scores a project in another partner's track, THE rules SHALL reject it.
- **B4.2-R6** WHEN a judge's badge is revoked, THE rules SHALL drop **all** of that judge's scores, earlier ones included (decision in `00-CONTEXT.md`).
- **B4.2-R7** WHEN a judge seals two finals for one project, THE earliest valid one SHALL count; later ones show as duplicates.

**Commit:** `feat(rules): B4.2 judge route, sealed scores, recusal and revoked-judge rules`

---

### B4.3 · Aggregation and leaderboard

**Requirements**
- **B4.3-R1** THE rules SHALL compute, per track, the **raw weighted mean** of each project's counted final scores, using that track's rubric weights. This is the only method.
- **B4.3-R2** THE maths SHALL be integer-only: scores × 100, fixed rounding, ties broken by earliest submission block, then lowest key.
- **B4.3-R3** THE leaderboard SHALL flag a project whose judges' scores spread more than 30% of the scale.
- **B4.3-R4** WHEN a judge is revoked, THE leaderboard SHALL drop their scores within one refresh.
- **B4.3-R5** THE leaderboard (organizer, web-only) SHALL show rankings per track only. Mapping rankings to prizes is TBD.

**Commit:** `feat(rules): B4.3 raw weighted mean aggregation and leaderboard`

---

### B4.4 · Freeze pipeline

**Requirements**
- **B4.4-R1** WHEN results freeze, THE `lanyard freeze` CLI SHALL, in this order: record the Arkiv and Sepolia head blocks; decrypt the scores; run the rules; write the readonly `results` record (rankings, record hashes, both blocks, `RULES_VERSION`, decryption key); call `ResultsPublisher.setEventResults`; call `declareWinner` once per winning team (all its prizes in one call, from `fixtures/prizes.json`); call `lockResults`.
- **B4.4-R2** WHEN freeze is run a second time, THE CLI SHALL refuse.
- **B4.4-R3** WHEN any step fails, THE CLI SHALL stop and print which steps are done, and SHALL be resumable from the failed step without repeating earlier writes.
- **B4.4-R4** WHEN `lanyard verify mumbai2026` runs after freeze, THE CLI SHALL print `MATCH` (with mocks now, Sepolia at I4).
- **B4.4-R5** THE CLI SHALL use only the `ResultsPublisher` interface.
- **B4.4-R6** THE CLI SHALL run on the operator's machine, reading the results key and the decryption key from its local `.env`. Nothing in `apps/app` can trigger it.
- **B4.4-R7** WHEN a team in `fixtures/prizes.json` has no counted submission, THE CLI SHALL refuse before writing anything.

**Tasks**
- [ ] Freeze pipeline with a persisted step log for resume
- [ ] E2E: freeze, then verify prints `MATCH` on mocks
- [ ] Seed 2 partners, 15 projects, 6 judges, one revocation, one recusal, and a placeholder `fixtures/prizes.json`

**Commit:** `feat(cli): B4.4 resumable freeze pipeline`

---

## Phase bug hunt

- [ ] A submission one block after the deadline: excluded
- [ ] A second submission from the same team: only the first counts, the second shows as a duplicate
- [ ] The organizer patches a project: fails
- [ ] A team member who isn't the lead submits: rejected
- [ ] A judge from partner A scores partner B's project: rejected
- [ ] A judge revoked mid-judging: all their scores stop counting
- [ ] Two finals from one judge for one project: only the earliest counts
- [ ] Two projects with identical scores: the same tie-break on every machine
- [ ] Read a `final_score` from Rabdi before freeze: ciphertext only
- [ ] Search the APK and the web export for the decryption key: absent
- [ ] Freeze twice: the second refuses
- [ ] Kill freeze after the results record is written: resume completes without a second record
- [ ] `prizes.json` names a team with no submission: freeze refuses before any write
- [ ] `lanyard verify` on a second laptop: `MATCH`
- [ ] Change one score byte in a copy of the inputs: verify prints the differing item

## Phase done when

- [ ] B4.1–B4.4 marked done in `TRACKER.md`
- [ ] Bug hunt run; Highs fixed with regression tests; Mediums fixed or in Known limitations
- [ ] Merged into `main`
