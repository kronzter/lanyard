# Lanyard · Tracker

This is the only plan file edited during development. **Edit only your own section** (Track A, Track B), so merges don't conflict. The P0 and integration sections are edited on those branches. Update a spec's row in the same commit as the spec itself.

Status values: `todo` · `doing` · `done` · `blocked`. Finding status: `open` · `fixed <sha>` · `known limitation`.

---

## P0 · Foundation (joint)

### Spike (P0.6)

| Check | Result | Notes |
| --- | --- | --- |
| S1 Local dev APK + AppKit connects MetaMask mobile | todo | |
| S2 Wallet adds and switches to Rabdi | todo | |
| S3 Arkiv SDK on Hermes with AppKit signer (record polyfills) | todo | |
| S4 `executeBatch` = one approval | todo | |
| S5 S2–S4 on Expo web (wagmi adapter) | todo | |
| S6 Wallet keeps app-set gas/gasPrice on Rabdi; desk transfer works | todo | |
| S7 Archive Sepolia read at a past block from the phone | todo | |
| S8 App-key load, quota per hour, watcher resume, ENS read volume | todo | |

**Fallbacks chosen:** none yet.

### Specs

| Spec | Owner | Status | Commit | Notes |
| --- | --- | --- | --- | --- |
| P0.6 Wallet and chain spike | pair | todo | | |
| P0.1 Repo skeleton and CI | A | done | 6b95a7f | ENSv2 pinned at contracts-v2@48b3e2d, forge-std v1.17.0. `expo export --platform web` joins `ci:local` in P0.5. CI also triggers on phase branches. CODEOWNERS uses `@person-a`/`@person-b` placeholders |
| P0.2 Shared types, config, deployments | B (built by A) | done | | Schema lives in `packages/shared/src/deployments.ts` (not `deployments/schema.ts`) so it stays inside a package. Unset addresses are `null`; `required()` throws on them. Empty label `""` = the edition name (organizer). Event times are demo values (27–28 Nov 2026 IST); set real ones before I4. Labels: ENSIP-15 normalized **and** `[a-z0-9-]` per segment (ENSIP-15 alone allows emoji and folds case) |
| P0.3 Interfaces, mocks, conformance | pair | todo | | |
| P0.4 Fixtures | B | todo | | |
| P0.5 App shell | A | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

---

## Track A · Person A

### A1 · Namespace

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| A1.1 Base name and edition registry | todo | | |
| A1.2 Badge books and LanyardRegistrar | todo | | |
| A1.3 Team names and reserved winner | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### A2 · Permissions and EnsReader

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| A2.1 Resolvers | todo | | |
| A2.2 Scoped grants | todo | | |
| A2.3 Revoke and revive | todo | | |
| A2.4 SepoliaEnsReader | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### A3 · Venue and routing

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| A3.1 Venue editor and export | todo | | |
| A3.2 GridRouter | todo | | |
| A3.3 Real VenueMap | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### A4 · Winners and consoles

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| A4.1 WinnerRegistrar | todo | | |
| A4.2 Results lock and publisher | todo | | |
| A4.3 ENS consoles | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

---

## Track B · Person B

### B1 · Arkiv data and tGLM drip

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| B1.1 Chain and tGLM drip | todo | | |
| B1.2 Record kinds and writers | todo | | |
| B1.3 Queue, batches, readers, watcher | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### B2 · Rules and verifier

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| B2.1 Time mapping | todo | | |
| B2.2 Rules core | todo | | |
| B2.3 Determinism and verify | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### B3 · Volunteers and tickets

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| B3.1 On-duty, shifts, clocks | todo | | |
| B3.2 Help tickets | todo | | |
| B3.3 Seats and partner tickets | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### B4 · Judging and freeze

| Spec | Status | Commit | Notes |
| --- | --- | --- | --- |
| B4.1 Projects, submission, acceptance | todo | | |
| B4.2 Judge flow | todo | | |
| B4.3 Aggregation and leaderboard | todo | | |
| B4.4 Freeze pipeline | todo | | |

**Bug hunt:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

---

## Integrations (joint)

### I1 · Names meet records

**Smoke (`pnpm e2e:i1`):** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### I2 · Real ENS history

**Smoke (`pnpm e2e:i2`, hashes match):** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### I3 · Real venue and router

**Two-phone smoke:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

### I4 · Full demo

**Demo script green twice:** todo · **Merged:** no

| # | Found by | What we tried | Expected | Actual | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |

---

## Interface change log

Every change to `packages/shared/src/interfaces` after P0 gets a row here. Either person may append a row.

| Commit | Interface | Change | Additive? | Real impl updated in |
| --- | --- | --- | --- | --- |
