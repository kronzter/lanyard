# I4 · Full demo and final cross bug hunt

**Joint integration** · **Branch:** `int/I4-full-demo` · **Starts when:** A4 and B4 are both merged · **Driver:** both

## Goal

The whole event runs end to end on Sepolia and Rabdi with no mocks: results freeze, winner names appear, and a second machine verifies `MATCH`. It runs on two Android phones (field roles) plus the web consoles.

## What gets swapped

| Before | After |
| --- | --- |
| `LANYARD_RESULTS=mock` (freeze CLI env) | `LANYARD_RESULTS=sepolia` (`SepoliaResultsPublisher`, results key from the local `.env`) |
| `providers.winnerBadge` no-op | A4.3 `<WinnerBadge>` |
| Seeds per track | One `seed-demo.ts` run on a clean edition |

## Steps (one commit each)

1. `chore(deploy): I4 fresh demo edition with all contracts, grants and faucet`
2. `chore(fixtures): I4 run full demo seed on sepolia and rabdi`
3. `feat(cli): I4 default results flag to sepolia`
4. `feat(app): I4 wire WinnerBadge into providers`
5. `test(e2e): I4 full demo script from badge to verify match`
6. `docs: I4 add known limitations and demo script to readme`

Build the demo APK with `eas build --platform android --profile preview --local` and install it on both phones.

## Demo script (also the e2e test)

1. At the onboarding desk (web), the organizer scans each person's wallet address, issues their badge, and drips tGLM. Team `zkpay` (Person A–D) is registered to its lead. `winner.zkpay…` is reserved and can't be claimed.
2. The coordinator makes Priya a lead. Priya clocks Ravi in from her phone (one approval); his duty-pass countdown shows.
3. Person B raises a ticket from their seat; Ravi claims it, walks the path, resolves it, and gets the next ticket.
4. The coordinator removes Priya's lead note; her next clock-in shows greyed out, with a reason.
5. The team lead submits before the deadline; a late submission from another team is excluded.
6. An Arkiv partner judge walks their route, scores, and seals. One judge is revoked: their scores drop from the leaderboard.
7. Freeze (`lanyard freeze`, run locally): results record → event results → `declareWinner` → lock.
8. `winner.zkpay.mumbai2026.lanyard.eth` resolves with its prizes, and the team screen shows the badge; `setText` on it reverts for everyone.
9. On a second laptop, `lanyard verify mumbai2026` prints `MATCH`.

## Final cross bug hunt: attack every pitch claim

- [ ] "Organizer can't backdate": the organizer edits a team's project or submission → fails
- [ ] "Revoked means revoked": a revoked judge's or volunteer's later records don't count, on both phones and both laptops
- [ ] "Hidden until freeze": read every `final_score` on Rabdi before freeze → ciphertext
- [ ] "Anyone can recompute": verify on a machine that never ran the app → `MATCH`; tamper with one input → the first differing item is printed
- [ ] "Winner names are permanent": the organizer and the results key both fail to change `winner.zkpay…` records; the name can't be transferred
- [ ] "No admin table": every permission shown in the permission map comes from chain reads
- [ ] "No backend": the app works with only the public Rabdi RPC, the archive Sepolia RPC and the user's wallet; no other host is contacted
- [ ] Freeze run again: refuses
- [ ] Two phones, one ticket, the same second: one winner
- [ ] Bundle scan of the APK and the web export: no organizer key, results key or decryption key
- [ ] Cold start: a fresh phone installs the local APK, connects a fresh MetaMask, gets dripped at the desk, and raises a ticket
- [ ] Cold start on a fresh browser: the web consoles load from `deployments/*.json`, with nothing hard-coded

Findings go in `TRACKER.md › I4`.

## Done when

- [ ] The demo script passes twice in a row
- [ ] Every High fixed; every open Medium in `README.md › Known limitations`
- [ ] `arkiv/friction.md` and `README.md` complete
- [ ] I4 marked done in `TRACKER.md`; merged into `main`
