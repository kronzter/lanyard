# B1 · Arkiv data layer and faucet

**Track:** B · **Branch:** `phase/B1-arkiv-data` · **Depends on:** P0 (including the P0.6 spike results) · **Integration:** I1

## Goal

One package, `packages/arkiv`, that every screen uses to write, read and watch Lanyard's records on Rabdi, signing with the user's own wallet through AppKit. Plus the on-chain `Faucet` that gives each new user their first tGLM. Track B's later phases build only on this.

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
| `results` | Results key | readonly + permissionlessExtension | Maximum | (payload: ranking, hashes, blocks, rule version, decryption key) |

Attribute types: labels and IDs are `str` (≤128 bytes); times are `u64` Unix seconds; references are record keys.

---

### B1.1 · Chain and faucet

**Requirements**
- **B1.1-R1** THE package SHALL pin `@arkiv-network/sdk` to an exact version and export the Rabdi chain config (ID `7794095`), including the `wallet_addEthereumChain` parameters.
- **B1.1-R2** THE app-side Arkiv client SHALL sign with the EIP-1193 provider from the shell's `useWallet()` (AppKit), never with a raw key. Only local scripts and the CLI take a key, from their own `.env`.
- **B1.1-R3** THE `Faucet` contract (`packages/faucet`, on Rabdi) SHALL hold organizer-funded tGLM, and its `drip(address)` SHALL send a fixed amount at most once per address, callable only by the organizer or addresses the organizer has given the desk role.
- **B1.1-R4** THE `/organizer/faucet` web-only screen SHALL let a desk wallet scan or paste an address, call `drip`, and show the transaction and the new balance. A fresh wallet has no gas to call `drip` itself, which is why the desk calls it.
- **B1.1-R5** THE package SHALL expose an in-memory `FakeArkiv` with the same API for unit tests, enforcing the owner, readonly, permissionlessExtension and expiry rules.
- **B1.1-R6** THE faucet address SHALL be written to `deployments/rabdi.json`.

If the P0.6 spike chose the no-contract fallback, R3 and R6 are dropped, and R4 sends a plain transfer from the desk wallet instead.

**Commit:** `feat(arkiv): B1.1 rabdi chain config, faucet contract and faucet screen`

---

### B1.2 · Typed record kinds and writers

**Requirements**
- **B1.2-R1** THE package SHALL define one typed schema per kind in the table above and export a writer per kind.
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
- **B1.3-R6** THE readers SHALL never use `ne()` or `not()`; a lint rule enforces this.
- **B1.3-R7** THE readers SHALL cache on the device and stay inside the public-RPC limits measured in P0.6.

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
- [ ] A record passes its `$expiresAt` block: the hook drops it without an event
- [ ] `drip` twice to one address: the second reverts. `drip` from a wallet without the desk role: reverts
- [ ] Search the web export and the APK for any private key: absent
- [ ] Sneak a `ne()` into a reader: lint fails

## Phase done when

- [ ] B1.1–B1.3 marked done in `TRACKER.md`
- [ ] Bug hunt run; Highs fixed with regression tests; Mediums fixed or in Known limitations
- [ ] Merged into `main`
