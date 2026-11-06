# I1 · Names meet records

**Joint integration** · **Branch:** `int/I1-names-meet-records` · **Starts when:** A1 and B1 are both merged · **Driver:** A

This doesn't block A2 or B2. Both people start their next phase as soon as their own phase merges; this is a short sync.

## Goal

The real names from A1 and the real records from B1 agree: every Arkiv record's `by` label is a badge that exists on Sepolia and belongs to the record's writer.

## What gets swapped

| Before | After |
| --- | --- |
| `fixtures/personas.json` with placeholder addresses | The real addresses of the seeded Sepolia badges |
| B1 writes on Rabdi with fixture labels | The same writes with real labels, from real wallets funded by the `Faucet` |
| Flags | Unchanged (the ENS flag stays `mock` until I2) |

## Steps (one commit each)

1. `chore(fixtures): I1 fill personas with seeded sepolia addresses`
2. `chore(fixtures): I1 drip tglm to persona wallets from the faucet` (records the drip tx list)
3. `test(e2e): I1 every arkiv record's by label resolves to its creator` (uses viem `getEnsAddress` directly; the real `EnsReader` is A2's job)
4. `test(e2e): I1 write one record of each B1 kind with real personas`
5. One record written from the Android app with a persona imported into MetaMask, through AppKit: checked by the same e2e test

## Smoke test

`pnpm e2e:i1` writes one record per kind on Rabdi as the right persona, then checks for each: `$creator` == `getEnsAddress(by + ".mumbai2026.lanyard.eth")`.

## Cross bug hunt

**A attacks B's code:**
- [ ] Write a record with `by` set to a badge you don't own: B1 doesn't stop it (correct, that's B2's job), and the e2e check flags it
- [ ] Use a persona wallet with zero tGLM: a clear error, no stuck queue
- [ ] `drip` a wallet that was already dripped: reverts, the desk screen says so
- [ ] Search the web export and the APK for any private key

**B attacks A's code:**
- [ ] Issue a badge from the onboarding script with a label that differs only in case: rejected
- [ ] Every label in `personas.json` exists on Sepolia, and every Sepolia badge is in `personas.json`
- [ ] `deployments/sepolia.json` loads through the P0.2 schema in B's code

**Re-run the riskiest items from the A1 and B1 phase bug hunts.**

Findings go in `TRACKER.md › I1`. Highs in track code are fixed by the track owner on `fix/<slug>` off `main`.

## Done when

- [ ] `pnpm e2e:i1` is green
- [ ] Highs fixed; Mediums fixed or in Known limitations
- [ ] I1 marked done in `TRACKER.md`; merged into `main`
