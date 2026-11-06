# B1 · Arkiv data layer and tGLM drip

**Track:** B · **Branch:** `phase/B1-arkiv-data` · **Depends on:** P0 (including the P0.6 spike results) · **Integration:** I1

## Goal

One package, `packages/arkiv`, that every screen uses to write, read and watch Lanyard's records on Rabdi, signing with the user's own wallet through AppKit. Plus the desk drip that gives each new user their first tGLM. Track B's later phases build only on this.

Read the committed Arkiv skills first (`.claude/skills/arkiv` routes to the rest). They target SDK 1.0.x on Rabdi and override any older assumption in this file.

## Out of scope

Deciding whether a record *counts* (B2). ENS reads: until I2, `by` labels come from `fixtures/personas.json`.

## Record kinds

Every record carries `app: "lanyard"`, `event: "mumbai2026"`, `kind`, and `by` (the writer's relative ENS label).

| `kind` | Owner | Flags | Expires | Other attributes |
| --- | --- | --- | --- | --- |
| `venue` | Organizer | readonly | Event end + 30 d | `version` (payload: `venue.json`) |
| `seat_assignment` | Organizer | readonly | Event end + 7 d | `hacker`, `seat` |
| `shift` | Lead | readonly | Event end + 7 d | `volunteer`, `zone`, `starts_at`, `ends_at`, `supersedes?` |
| `clock` | Lead or volunteer | readonly | Event end + 7 d | `volunteer`, `action` (`in`/`out`), `stated_at?` |
| `duty_pass` | Lead | readonly | Exactly at shift end | `volunteer` |
| `ticket` | Hacker | none | 4 h | `seat`, `category`, `status` |
| `ticket_claim` | On-duty volunteer, or partner staff for partner tickets | none | 15 min | `ticket` |
| `ticket_resolution` | Same as the winning claim | readonly | Event end + 7 d | `ticket` |
| `project` | Team lead | none | Results + 30 d | `team`, `track` |
| `submission` | Team lead | readonly + permissionlessExtension | Maximum | `project` |
| `acceptance` | Organizer | readonly | Results + 30 d | `project`, `track` |
| `rubric` | Organizer or partner | readonly | Results + 30 d | `track` (payload: criteria, weights, scale) |
| `judge_assignment` | Organizer or partner | readonly | Judging end + 2 d | `judge`, `project` |
| `score_sheet` | Judge | none | Judging end + 2 d | `project`, `judge` |
| `final_score` | Judge | readonly | Results + 30 d | `project`, `judge` |
| `recusal` | Judge or organizer | readonly | Results + 30 d | `project`, `judge` |
| `results` | Results key | readonly + permissionlessExtension | Maximum | (payload: ranking, key + content hash of every judging input, both blocks, rule version, decryption key) |
| `drip` | Desk wallet | readonly | Event end + 7 d | `recipient`, `tx` |

Attribute types: labels and IDs are `str` (≤128 bytes); times are `u64` Unix seconds; references are record keys.

---

### B1.1 · Chain and tGLM drip

Rabdi supports EOAs and native entity operations only, not arbitrary EVM contracts, so there's no faucet contract. The desk sends tGLM from its own wallet.

**Requirements**
- **B1.1-R1** THE package SHALL pin `@arkiv-network/sdk` (1.0.x) to an exact version and export the Rabdi chain config (`rabdi({ accessKey })`, ID `7794095`), including the `wallet_addEthereumChain` parameters.
- **B1.1-R2** THE app-side Arkiv client SHALL use `EXPO_PUBLIC_ARKIV_ACCESS_KEY` (the public app key) for its transport and SHALL sign with the EIP-1193 provider from the shell's `useWallet()` (AppKit), never with a raw key. Only local scripts and the CLI take a signing key and their own Arkiv access key, from their own `.env`. Keyed URLs are redacted in every log and error.
- **B1.1-R3** THE `/organizer/faucet` web-only screen SHALL let the desk wallet scan or paste an address, send a fixed tGLM amount (from `event.config.ts`) to it, then write a readonly `drip {recipient, tx}` record. A fresh wallet has no gas to fetch tGLM itself, which is why the desk sends it.
- **B1.1-R4** WHEN a `drip` record from the desk wallet already exists for that address, THE screen SHALL refuse to send again.
- **B1.1-R5** THE package SHALL expose an in-memory `FakeArkiv` with the same API for unit tests, enforcing the owner, readonly, permissionlessExtension and expiry rules.
- **B1.1-R6** THE desk wallet address SHALL be written to `deployments/rabdi.json`.

**Commit:** `feat(arkiv): B1.1 rabdi chain config and desk tglm drip`

---

### B1.2 · Typed record kinds and writers

**Requirements**
- **B1.2-R1** THE package SHALL define one typed schema per kind in the table above with `defineSchema`, marking `.indexed()` every column a reader filters on, and export a writer per kind.
- **B1.2-R2** WHEN any write is made, THE writer SHALL attach the four common attributes, plus the expiry and flags from the table.
- **B1.2-R3** WHEN a write would exceed Arkiv limits (32 attributes, 128-byte strings, 128 KiB payload, maximum lifetime), THE writer SHALL reject it before sending.
- **B1.2-R4** WHEN an extension would move expiry earlier, THE writer SHALL reject it.
- **B1.2-R5** THE `arkiv/schema.md` SHALL be generated from the schemas, not written by hand.

**Commit:** `feat(arkiv): B1.2 typed record kinds and writers`

---

### B1.3 · Write queue, batches, readers, live watcher

**Requirements**
- **B1.3-R1** WHEN a write is sent, THE wrapper SHALL queue writes per wallet, wait for the receipt, and never resend blindly. On an uncertain result (wallet app switch lost, WalletConnect timeout, app backgrounded) it SHALL read back before retrying.
- **B1.3-R2** WHEN the user rejects a request in their wallet, THE queue SHALL drop that write with a clear message and not retry it.
- **B1.3-R3** WHEN several records must exist together (clock-in + duty pass; a lost claim + the next offer), THE wrapper SHALL use one `executeBatch`, which is also one wallet approval.
- **B1.3-R4** THE readers SHALL be typed, and SHALL skip, not crash on, records that fail schema parsing.
- **B1.3-R5** WHEN screens need live updates, THE `useArkivLive` hook SHALL use `watchEntityEvents` with `onError`, and SHALL compare `$expiresAt` to the current block, because expiry fires no event.
- **B1.3-R6** WHEN the app resumes from the background, or the watcher errors, THE hook SHALL recreate the watcher at head and reconcile current state with a query. A watcher more than ~1,000 blocks behind never recovers, and old logs can't be backfilled.
- **B1.3-R7** THE readers SHALL never use `ne()` or `not()`; a lint rule enforces this.
- **B1.3-R8** THE readers SHALL cache on the device and stay inside the app-key quota measured in P0.6.
- **B1.3-R9** EVERY write SHALL carry an explicit nonce (latest, with pending checked), gas (floor 1,000,000 + 400,000 per extra batch operation, at least 2× the estimate) and current gasPrice, and SHALL check `receipt.status`. The only retry allowed is the single gas-exhaustion retry described in the `arkiv-write-safety` skill.

**Tasks**
- [ ] Per-wallet queue with read-back reconciliation, persisted across app restarts
- [ ] Batch helper
- [ ] Readers: `ticketsOpenInZone`, `myShifts`, `projectsForJudge`, `leaderboardInputs`, `allRecordsForEvent`
- [ ] `useArkivLive` React hook
- [ ] Start `arkiv/friction.md`, and add to it every time something surprises you

**Commit:** `feat(arkiv): B1.3 write queue, batches, readers and live hook`

---

## Phase bug hunt

- [ ] A string attribute over 128 bytes, 33 attributes, a payload over 128 KiB: all rejected before sending
- [ ] Expiry beyond the maximum lifetime: rejected with a clear error
- [ ] Extending to an earlier deadline: rejected
- [ ] Patching a readonly record on Rabdi: `ReadOnlyEntity`
- [ ] A stranger writes junk with `app: "lanyard"`: readers skip it, nothing crashes
- [ ] Kill the network mid-write and reconnect: no duplicate, the queue reconciles
- [ ] Background the app while the wallet is asking for approval, approve, come back: exactly one record
- [ ] Reject the request in the wallet: the write is dropped with a message, with no retry loop
- [ ] The same wallet writing from the phone and the web at once: retries never create a duplicate
- [ ] A clock-in batch asks for exactly one approval
- [ ] The watcher loses its connection: `onError` fires and the UI shows "live updates paused"
- [ ] Background the app for 40 min and resume: the watcher is recreated, missed changes show up after reconciling
- [ ] A record passes its `$expiresAt` block: the hook drops it without an event
- [ ] Drip twice to one address: the second is refused before sending
- [ ] Search logs and error messages for the keyed Rabdi URL: always redacted
- [ ] Search the web export and the APK for any private key: absent
- [ ] Sneak a `ne()` into a reader: lint fails

## Phase done when

- [ ] B1.1–B1.3 marked done in `TRACKER.md`
- [ ] Bug hunt run; Highs fixed with regression tests; Mediums fixed or in Known limitations
- [ ] Merged into `main`
