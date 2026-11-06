# A1 · ENS namespace

**Track:** A · **Branch:** `phase/A1-namespace` · **Depends on:** P0 · **Integration:** I1

## Goal

Create the name tree every other feature relies on.

```
lanyard.eth                                  base (organizer)
└── mumbai2026.lanyard.eth                   edition registry, EMANCIPATED
    ├── hackers | judges | volunteers | partners
    │                                        book names owned by organizer,
    │                                        each pointing to a MANAGED registry
    │   (partner names and their judges/staff sub-books are created in A2.2)
    └── <team>.mumbai2026.lanyard.eth        team names owned by team leads
        └── winner.<team>…                   reserved now, promoted in A4
```

**Why the edition registry is emancipated:** team names live directly in it. If the organizer held registry-wide unregister, set-resolver or set-subregistry roles there, it could take or redirect any team's name. Emancipated means the only registry-wide roles are register and renew, held by `LanyardRegistrar`. The organizer controls its book names through name-level roles on names it owns.

**Who sends these transactions:** only the organizer, from local scripts for now and from the A4.3 onboarding desk later. Holders and team leads never pay Sepolia gas.

## Out of scope

Resolvers, partner sub-books and permission notes (A2). `WinnerRegistrar` itself (A4.1): A1.3 only reserves the slot and leaves a one-shot setter. The desk UI (A4.3). Any Arkiv code (Track B).

---

### A1.1 · Base name and edition registry

**Requirements**
- **A1.1-R1** WHEN an edition is created, THE deploy script SHALL deploy a `UserRegistry` through ENS's verifiable factory and attach it to `lanyard.eth` with `setSubregistry`.
- **A1.1-R2** WHEN edition setup completes, THE edition registry SHALL report `isEmancipated() == true`, with only `ROLE_REGISTRAR` and `ROLE_RENEW` held on its root, both by `LanyardRegistrar`.
- **A1.1-R3** WHEN the edition is created, THE deploy script SHALL reserve the protected labels `admin`, `staff`, `lanyard`, `ethglobal`, `winner` in the edition registry.

**Tasks**
- [ ] Find the ENSv2 Sepolia addresses (verifiable factory, `UserRegistry` implementation, Permissioned Resolver implementation, Universal Resolver) and record them in `deployments/sepolia.json`
- [ ] Register `lanyard.eth` on Sepolia with a long expiry
- [ ] `deploy-edition.ts` (viem, organizer key from local `.env`), tested on a local fork first
- [ ] Foundry test: root role holders are exactly as in R2, with no `ROLE_UPGRADE`

**Done when** `deploy-edition.ts` runs on a Sepolia fork and on Sepolia, and the emancipation test passes on both.

**Commit:** `feat(ens): A1.1 base name and emancipated edition registry`

---

### A1.2 · Badge books and `LanyardRegistrar`

**Requirements**
- **A1.2-R1** WHEN the edition is created, THE deploy script SHALL register the four book labels (`hackers`, `judges`, `volunteers`, `partners`) to the organizer **before** any team can register.
- **A1.2-R2** WHEN a book name is registered, THE deploy script SHALL attach a managed `UserRegistry` in which the organizer holds register, unregister, renew and set-resolver on its root, and `LanyardRegistrar` holds register and renew.
- **A1.2-R3** WHEN any badge is issued, THE registrar SHALL leave `ROLE_CAN_TRANSFER_ADMIN` out of the role bitmap, so badges can't be transferred.
- **A1.2-R4** THE registrar SHALL set expiries per book:

  | Book | Expiry |
  | --- | --- |
  | hackers | event end + 7 days |
  | judges (and partner `judges` sub-books) | judging end + 24 h |
  | volunteers, partners (and partner `staff` sub-books) | event end |

- **A1.2-R5** WHEN anyone other than the organizer calls `registerBadge`, THE registrar SHALL revert.
- **A1.2-R6** WHEN a badge is issued, THE registrar SHALL emit `BadgeIssued(book, label, owner, expiry)`.

**Design**
- `registerBadge(bytes32 book, string label, address owner, uint64 expiry, uint256 roleBitmap)`: organizer only. The organizer sends it from the desk after scanning or pasting the holder's address.
- `renew(bytes32 book, string label, uint64 newExpiry)`: used by A2.3 for revival.
- App reads always use the label hash, never token IDs (token IDs change whenever roles change).

**Tasks**
- [ ] `deploy-books.ts`
- [ ] `LanyardRegistrar.sol`: books, expiry table, organizer-only issue
- [ ] Foundry: every requirement has a passing and a failing test
- [ ] `issue-badge.ts` CLI for seeding

**Commit:** `feat(contracts): A1.2 badge books and LanyardRegistrar`

---

### A1.3 · Team names and the reserved `winner` slot

**Requirements**
- **A1.3-R1** WHEN the organizer registers a team, THE registrar SHALL deploy a team `UserRegistry` and register `<team>` in the edition registry to the team lead's address, with that subregistry and only the roles `ROLE_SET_RESOLVER` and `ROLE_RENEW`.
- **A1.3-R2** WHEN a team label is submitted, THE registrar SHALL accept it only if it's normalized (ENSIP-15), matches `[a-z0-9-]{3,32}`, doesn't start or end with `-`, and isn't a book or reserved label.
- **A1.3-R3** WHEN a team registers, THE registrar SHALL reserve `winner` in the team subregistry in the same transaction (owner `0`, bitmap `0`, far-future expiry).
- **A1.3-R4** THE team subregistry SHALL be emancipated: the team lead holds `ROLE_REGISTRAR` (for member names), and the `ROLE_REGISTER_RESERVED` and `ROLE_RENEW` slots go to whatever address `winnerRegistrar` holds, and nobody else.
- **A1.3-R5** THE registrar SHALL expose `setWinnerRegistrar(address)`, callable once, by the organizer. WHEN it's unset, team registration SHALL still work, and SHALL grant the winner roles at the moment it's set (A4.1 calls a backfill for teams registered earlier).
- **A1.3-R6** THE team name expiry SHALL be results + 30 days.
- **A1.3-R7** WHEN anyone other than the organizer calls `registerTeam`, THE registrar SHALL revert.

**Tasks**
- [ ] `registerTeam(string label, address lead)` in `LanyardRegistrar`
- [ ] Label validator with a fuzz test
- [ ] One-shot `setWinnerRegistrar` and `backfillWinnerRoles(string[] teams)`
- [ ] `register-team.ts` CLI; seed three demo teams (Person A–D each)

**Commit:** `feat(contracts): A1.3 team names with reserved winner slot`

---

## Phase bug hunt

- [ ] Transfer a badge with `safeTransferFrom` and `unsafeTransfer`: both revert
- [ ] As the organizer, `unregister` a team name in the edition registry: reverts
- [ ] `isEmancipated()` is true on the edition and team registries; `roleCount(ROOT_RESOURCE)` shows no unexpected holders, including `ROLE_UPGRADE`
- [ ] Register teams named `judges`, `admin`, `winner`, `Judges`, `judges `, `-zk`, an emoji: all rejected
- [ ] Register the same team twice: the second fails
- [ ] A non-organizer calls `registerBadge` or `registerTeam`: reverts
- [ ] A team lead calls `setSubregistry` on their own name: reverts
- [ ] A team lead registers `winner` in their own subregistry: reverts
- [ ] A badge at exactly its expiry timestamp is treated as expired (`block.timestamp >= expiry`)
- [ ] Grant then revoke a role; the name is still found by label hash
- [ ] Call `setWinnerRegistrar` twice: the second reverts
- [ ] Who holds dangerous roles on `lanyard.eth`'s parent registry, and is that acceptable for the demo? Write the answer in `README.md › Known limitations`
- [ ] `deployments/sepolia.json` passes the P0.2 schema

## Phase done when

- [ ] A1.1, A1.2, A1.3 marked done in `TRACKER.md`
- [ ] Bug hunt run by someone who didn't write the code; Highs fixed with regression tests
- [ ] Mediums fixed or in Known limitations
- [ ] Merged into `main`
