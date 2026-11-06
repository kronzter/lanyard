# A2 · Permissions and the real `EnsReader`

**Track:** A · **Branch:** `phase/A2-permissions-ens-reader` · **Depends on:** A1 · **Integration:** I2

## Goal

Hand out narrow, checkable permissions with ENS Enhanced Access Control, so Lanyard never needs its own admin table. Then ship the real `EnsReader`, which lets Track B ask "who held this badge, with what note, at that block?". It runs both in the app (Hermes and browser) and in the CLI (Node).

## Who holds what

| Account | Where | Permission |
| --- | --- | --- |
| Organizer | Every managed book's root | Register, unregister, renew, set resolver |
| Head judge | `judges` book root | Register and unregister judges only |
| Each partner | Its own sub-books `judges.<partner>.partners…` and `staff.<partner>.partners…` | Register and unregister in those two sub-books only |
| Volunteer coordinator | Staff resolver | `setText` on key `lanyard.perms` only |
| Results key | Results resolver | `setText` on `lanyard.results`, `lanyard.prizes`, `lanyard.results-hash`, `lanyard.edition`; revoked at lock (A4.2) |

Partners come from `event.config.ts` (`arkiv`, `ens` for now). A third partner is just one more run of the onboarding script.

## Out of scope

The consoles that call these grants (A4.3). Any rule about what a note *means* (Track B).

---

### A2.1 · Resolvers

**Requirements**
- **A2.1-R1** THE deploy script SHALL create four Permissioned Resolvers through the verifiable factory: **staff**, **hackers**, **event**, **results**.
- **A2.1-R2** THE staff resolver SHALL serve only staff names (judges, volunteers, partner names and both partner sub-books), because a key-scoped role reaches every name on a resolver.
- **A2.1-R3** WHEN a badge is issued, THE registrar SHALL set its resolver to the one for its book in the same transaction: hackers → hackers resolver; judges, volunteers, partners and sub-books → staff resolver.
- **A2.1-R4** THE team registration SHALL point each team name at the hackers resolver by default; the team lead can repoint it (A1.3 gave them `ROLE_SET_RESOLVER`).
- **A2.1-R5** THE edition name SHALL use the event resolver; winner names use the results resolver (A4.1).

**Commit:** `feat(ens): A2.1 staff, hackers, event and results resolvers`

---

### A2.2 · Scoped grants

**Requirements**
- **A2.2-R1** WHEN the coordinator is appointed, THE organizer SHALL call `grantSetterRoles(encode(setText(0x,'lanyard.perms','')), coordinator)` on the staff resolver.
- **A2.2-R2** WHEN a volunteer is made a lead, THE coordinator SHALL set `lanyard.perms` on that name to a comma-separated list containing `shift-manager`; unmaking a lead removes it.
- **A2.2-R3** WHEN a partner is onboarded, THE organizer SHALL create `<partner>.partners`, and under it the `judges` and `staff` sub-books, and SHALL grant the partner `ROLE_REGISTRAR` and `ROLE_UNREGISTER` on those two sub-book roots only.
- **A2.2-R4** THE head judge SHALL hold register and unregister on the `judges` book root only.
- **A2.2-R5** THE system SHALL never call `setApprovalForAll` on badge tokens.

**Tasks**
- [ ] `grant-roles.ts`: coordinator, head judge, partners (loops over `event.config.ts` partners)
- [ ] `set-perms.ts` (make/unmake lead), used by seeds now and by the coordinator console in A4.3
- [ ] Foundry and script tests: each grant works, and each forbidden neighbour reverts

**Commit:** `feat(ens): A2.2 scoped grants for coordinator, head judge and partners`

---

### A2.3 · Revoke and revive

**Requirements**
- **A2.3-R1** WHEN a badge must be revoked, THE holder of `ROLE_UNREGISTER` on that book or sub-book SHALL call `unregister(labelhash)`; the name stops resolving from that block on.
- **A2.3-R2** WHEN an expired badge must be restored with its previous owner and roles, THE organizer SHALL call the registrar's `renew` (the registrar holds `ROLE_RENEW` on the book root).
- **A2.3-R3** THE scripts SHALL print the Sepolia block of each revoke, revive and note change, and append it to `fixtures/sepolia-history.json` so I2 can replay it.

**Commit:** `feat(ens): A2.3 revoke and revive with recorded blocks`

---

### A2.4 · `SepoliaEnsReader`

**Requirements**
- **A2.4-R1** THE `SepoliaEnsReader` SHALL implement `EnsReader` with viem `getEnsAddress`, `getEnsText` and registry expiry reads, all with `blockNumber`, through the Universal Resolver, against an archive RPC.
- **A2.4-R2** THE `SepoliaEnsReader` SHALL pass `runEnsReaderConformance` against a scenario replayed on a Sepolia fork.
- **A2.4-R3** WHEN `sepoliaBlockAt(t)` is called, THE reader SHALL binary-search block timestamps and return the latest block with timestamp ≤ t, caching the results.
- **A2.4-R4** THE reader SHALL cache reads keyed by (label, key, block). The cache is disposable and works on device (in memory plus AsyncStorage on the app, in memory on Node).
- **A2.4-R5** WHEN the archive RPC fails, THE reader SHALL throw, never return `null` as if the name didn't exist.
- **A2.4-R6** THE reader SHALL take its RPC URL as a constructor argument (`EXPO_PUBLIC_SEPOLIA_RPC_URL` in the app, a local env var in the CLI) and SHALL import nothing Node-only.

**Commit:** `feat(ens): A2.4 SepoliaEnsReader with block lookup and cache`

---

## Phase bug hunt

- [ ] The coordinator sets `avatar` or any key other than `lanyard.perms`: reverts
- [ ] The coordinator sets `lanyard.perms` on a name served by a different resolver: fails
- [ ] A partner registers in another partner's sub-book, or in `volunteers`: reverts
- [ ] A partner registers in its own `staff` and `judges` sub-books: works
- [ ] The head judge unregisters a volunteer: reverts
- [ ] After `unregister`, `SepoliaEnsReader.resolve` at a later block returns `null`, and at an earlier block returns the old owner
- [ ] After revival with `renew`, the owner and roles come back; a name-scoped renew grant fails on an expired name
- [ ] Unregister, then re-register the same label to someone else: the reader at the old block still returns the old owner
- [ ] Grant one role to a 16th account on one resource: the 15-holder limit bites; confirm the demo never needs more
- [ ] `sepoliaBlockAt` for a timestamp exactly equal to a block's, and for one between two blocks
- [ ] Kill the RPC mid-read: the error surfaces
- [ ] The reader returns identical results on Node and inside the Android app for 10 (label, block) pairs
- [ ] No demo badge holder has `setApprovalForAll` set for any account

## Phase done when

- [ ] A2.1–A2.4 marked done in `TRACKER.md`
- [ ] `SepoliaEnsReader` passes conformance
- [ ] Bug hunt run; Highs fixed with regression tests; Mediums fixed or in Known limitations
- [ ] Merged into `main`
