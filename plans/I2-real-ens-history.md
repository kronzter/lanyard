# I2 · Real ENS history

**Joint integration** · **Branch:** `int/I2-real-ens-history` · **Starts when:** A2 and B2 are both merged · **Driver:** B

This doesn't block A3 or B3.

## Goal

The rules engine (B2) runs on real Sepolia history through the real `SepoliaEnsReader` (A2.4), both in the CLI and in the Android app, and gives the same answers it gave on the mock.

## What gets swapped

| Before | After |
| --- | --- |
| `EXPO_PUBLIC_LANYARD_ENS=mock`, `LANYARD_ENS=mock` | Both `sepolia` (the default in `.env.example`) |
| `fixtures/ens-history.json` scripted | Plus `fixtures/sepolia-history.json`, recorded by the A2.3 scripts |

## Scenario played live on Sepolia + Rabdi

1. Priya holds `priya.volunteers`; the coordinator sets `lanyard.perms=shift-manager` (A2.2 script).
2. Priya writes a `shift` on Rabdi from her phone. **Expected: counts.**
3. The coordinator removes the note. Note the Sepolia block.
4. Priya writes another `shift`. **Expected: rejected, with reason "no shift-manager at block N".**
5. The organizer unregisters `ravi.volunteers`; Ravi writes a record. **Expected: rejected.**
6. The organizer revives an expired badge through the registrar; its owner writes again. **Expected: counts.**

## Steps (one commit each)

1. `chore(fixtures): I2 add recorded sepolia history from A2 scripts`
2. `feat(app): I2 default ENS flag to sepolia`
3. `test(e2e): I2 lead note removal scenario on sepolia and rabdi`
4. `test(e2e): I2 revoke and revive scenario on sepolia and rabdi`
5. `test(e2e): I2 rules output hash matches across two machines and the app`

## Smoke test

`pnpm e2e:i2` plays the scenario, runs the rules with `SepoliaEnsReader`, asserts each expected outcome, then prints `lanyard hash mumbai2026 --sepolia-block M` with the Arkiv head block it saw. With no writes in between, run the hash on the second laptop and read it in the Android app: all identical.

## Cross bug hunt

**A attacks B's code:**
- [ ] Write a record in the same Sepolia block as the note removal (by timestamp): the rules pick the earlier block consistently
- [ ] Re-register a revoked label to a new owner: old records stay tied to the old owner
- [ ] Throttle the archive RPC: the rules and the CLI fail loudly, never silently counting or rejecting
- [ ] The app on a slow mobile network: shows "checking…" rather than a wrong verdict

**B attacks A's code:**
- [ ] `SepoliaEnsReader` vs direct viem reads for 20 random (label, block) pairs: identical
- [ ] `sepoliaBlockAt` at exact block timestamps and between blocks
- [ ] Does the cache (memory and AsyncStorage) return a stale value after a note change at a newer block? It must not

**Re-run the riskiest items from the A2 and B2 phase bug hunts.**

Findings go in `TRACKER.md › I2`.

## Done when

- [ ] `pnpm e2e:i2` is green; the hashes from two machines and the app match
- [ ] Highs fixed (on the owner's `fix/` branch); Mediums fixed or in Known limitations
- [ ] I2 marked done in `TRACKER.md`; merged into `main`
