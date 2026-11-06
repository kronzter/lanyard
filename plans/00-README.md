# Lanyard · Build plan

Event OS for hackathons on **ENSv2 (Sepolia)** and **Arkiv (Rabdi)**, shipped as an **Expo dApp** for Android and web. Two builders, two tracks, phase- and spec-driven.

- **Person A · ENS & venue track.** Contracts, names, permissions, ENS reads, venue grid, routing, winner names, ENS consoles.
- **Person B · Arkiv & flows track.** Arkiv records, tGLM drip, rules engine, verifier CLI, volunteer, ticket and judging flows.

Read `00-CONTEXT.md` first (the master context), then `00-git-workflow.md` before the first commit.

**Plan files are frozen.** They are committed once and are not edited during development. All progress (spec status, bug-hunt findings, interface changes, integration sign-off) goes in **`plans/TRACKER.md`**.

## The app

- **Expo + Expo Router**, TypeScript, at `apps/app`. Targets **Android and web**. The code stays iOS-compatible, but iOS is never built, tested or demoed.
- **Dev builds only.** Reown AppKit's native modules don't run in Expo Go.
- **Every APK build runs locally**: `eas build --platform android --profile <development|preview> --local`. Never queue a cloud EAS build.
- **Wallets: Reown AppKit.** The native SDK on Android, the wagmi adapter on web. Users connect their own wallet (MetaMask, Rainbow, …). If the P0.6 spike shows external wallets can't write to Arkiv, the fallback is AppKit's email/social-login wallet.
- **No backend.** Every action is signed in the app by the actor's own wallet. The only privileged jobs (deploy, seed, freeze) are local CLIs and scripts the organizer runs, with keys in their local `.env`.
- **Screen split.** Field roles (hacker, volunteer, lead, judge, team) use phones. Organizer screens, ENS consoles and the venue editor are web-only screens.

## Who pays gas

| Chain | Who sends transactions | How they get gas |
| --- | --- | --- |
| Sepolia | Organizer (badges, teams, revoke, revive), volunteer coordinator, head judge, partners, results key (freeze CLI) | Staff wallets are funded with Sepolia ETH by hand |
| Rabdi | Everyone who writes an Arkiv record | The onboarding desk sends a fixed amount of tGLM from the desk wallet, once per address (B1.1) |

Hackers, volunteers and team leads **never send a Sepolia transaction**. They only read ENS.

## How the work is cut

```
                 P0 Foundation (joint)
   spike · shared types · interfaces · mocks · fixtures · app shell
                 /                                  \
   Track A (Person A)                          Track B (Person B)
   A1 Namespace                                B1 Arkiv data + tGLM drip
        │            ──► I1 Names meet records ◄──    │
   A2 Permissions + EnsReader                  B2 Rules + verifier
        │            ──► I2 Real ENS history ◄──      │
   A3 Venue + routing                          B3 Volunteers + tickets
        │            ──► I3 Real venue + router ◄──   │
   A4 Winners + ENS consoles                   B4 Judging + freeze
                     ──► I4 Full demo ◄──
```

**The only hard dependency between people is P0.** After that:

- Every phase depends only on **P0** and on **the same track's earlier phases**. A never waits for B, and B never waits for A.
- Each track codes against **interfaces in `packages/shared`**, with **mocks** standing in for the other track's work, behind **feature flags**.
- **Integration checkpoints (I1–I4)** are a separate, third kind of dependency. One starts when **both** matching phases are merged. It flips one flag from mock to real, runs a smoke test, and runs a **cross bug hunt**.
- **Integrations never gate the next phase.** When your phase is merged, start your next phase straight away. The checkpoint happens whenever both of you are ready.

## Phases and specs

| Phase | File | Specs |
| --- | --- | --- |
| P0 · joint | `P0-foundation.md` | P0.6 wallet + chain spike (first) · P0.1 repo + CI · P0.2 shared types + config · P0.3 interfaces, mocks, conformance · P0.4 fixtures · P0.5 app shell |
| A1 | `A1-namespace.md` | A1.1 base + edition · A1.2 books + badge registrar · A1.3 teams + reserved `winner` |
| B1 | `B1-arkiv-data.md` | B1.1 chain + tGLM drip · B1.2 record kinds + writers · B1.3 queue, batch, readers, watcher |
| I1 | `I1-names-meet-records.md` | Real badges, real `by` labels on Arkiv |
| A2 | `A2-permissions-ens-reader.md` | A2.1 resolvers · A2.2 scoped grants · A2.3 revoke + revive · A2.4 real `EnsReader` |
| B2 | `B2-rules-verifier.md` | B2.1 time mapping · B2.2 rules core · B2.3 determinism + `lanyard verify` |
| I2 | `I2-real-ens-history.md` | ENS flag → `sepolia`; rules on real history |
| A3 | `A3-venue-routing.md` | A3.1 venue editor + export · A3.2 grid router · A3.3 real `VenueMap` |
| B3 | `B3-volunteers-tickets.md` | B3.1 on-duty + shifts · B3.2 tickets · B3.3 partner tickets + seats |
| I3 | `I3-real-venue.md` | Router flag → `grid`; real venue on Arkiv |
| A4 | `A4-winners-consoles.md` | A4.1 `WinnerRegistrar` · A4.2 results lock + publisher · A4.3 ENS consoles |
| B4 | `B4-judging.md` | B4.1 projects + submissions · B4.2 judge flow · B4.3 aggregation · B4.4 freeze pipeline |
| I4 | `I4-full-demo.md` | Results flag → `sepolia`; full demo; final cross bug hunt |

Within a track, phases run in this order. A phase is done when its bug hunt is clean (see the lifecycle below).

## Ownership of paths

Disjoint paths mean merges don't conflict.

| Path | Owner |
| --- | --- |
| `packages/shared/**` | **Both.** Additive changes only, each in its own commit (see below) |
| `.claude/skills/**`, `skills-lock.json` | Both |
| `fixtures/**`, `apps/app/app/_layout.tsx`, `apps/app/src/shell/**`, `apps/app/src/flags.ts`, `apps/app/src/providers.ts`, `apps/app/app.json`, `apps/app/eas.json`, `apps/app/package.json`, `README.md` | Both (P0, then integration branches only) |
| `packages/contracts/**`, `packages/ens/**`, `packages/venue/**` | A |
| `apps/app/app/admin/ens/**`, `apps/app/app/venue/**`, `apps/app/src/components/venue/**` | A |
| `packages/arkiv/**`, `packages/rules/**`, `packages/cli/**`, `arkiv/**` | B |
| `apps/app/app/{volunteer,lead,tickets,judge,team,organizer}/**` | B |
| `deployments/sepolia.json` | A writes; B only reads |
| `deployments/rabdi.json` | B writes; A only reads |
| `plans/TRACKER.md` | Each person edits only their own track's section; integration sections are edited on integration branches |
| `plans/*.md` (everything else) | Frozen. Changed only by a joint decision |
| `e2e/**` | Integration branches only |

If both people add app dependencies, `pnpm-lock.yaml` will conflict. Resolve it by re-running `pnpm i` after merging `main`.

`CODEOWNERS` encodes this table (P0.1).

## Interfaces are the contract

Defined in P0.3, in `packages/shared/src/interfaces/`:

| Interface | Real version by | Used by | Mock until |
| --- | --- | --- | --- |
| `EnsReader` (resolve, text, expiry at a Sepolia block) | A2.4 | B2, B3, B4 (app and CLI) | I2 |
| `Router` (path, distances, nextTicket, judgeRoute) | A3.2 | B3, B4 | I3 |
| `ResultsPublisher` (setEventResults, declareWinner, lockResults) | A4.2 | B4 freeze CLI | I4 |
| `Venue` types + `venue.json` format | P0.2, filled by A3.1 | B3 (publish, seats) | I3 |

Rules for changing them:

1. **Additive mid-phase** (a new optional field or a new method): allowed. Put it in its **own commit** that touches only `packages/shared`, update the mock in the same commit, and add a row to the interface change log in `TRACKER.md`. The other person picks it up the next time they merge `main`.
2. **Breaking** (rename, remove, changed meaning): only on an integration branch, with both people present.
3. Each real implementation must pass the **conformance suite** for its interface, and so must the mock. That's what makes the swap at integration boring.

## Feature flags

| Flag | Read by | Values | Flipped at |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_LANYARD_ENS` / `LANYARD_ENS` | App (`apps/app/src/flags.ts`) / CLI | `mock` · `sepolia` | I2 |
| `EXPO_PUBLIC_LANYARD_ROUTER` | App | `stub` · `grid` | I3 |
| `LANYARD_RESULTS` | Freeze CLI | `mock` · `sepolia` | I4 |

Defaults stay `mock`/`stub` on phase branches, so nobody's work depends on the other track being finished.

Expo inlines every `EXPO_PUBLIC_*` variable into the app bundle. Use them for flags and app-restricted RPC URLs only, **never** for keys.

## Phase lifecycle

Every phase, every time:

1. **Branch** from an up-to-date `main`: `phase/<ID>-<slug>`.
2. **Specs in order, one commit per spec** (format in `00-git-workflow.md`). Mark the spec done in `TRACKER.md` in the same commit.
3. **Phase bug hunt** on the phase branch (see below). Log the findings in `TRACKER.md`.
4. **Fix** every High: one fix commit per finding, with its regression test in the same commit.
5. Fix each Medium, or write it up in `README.md › Known limitations`.
6. **Merge** into `main` and push. Mark the phase merged in `TRACKER.md`. Start the next phase straight away.

## Bug hunts

**Phase bug hunt (after every phase).** Run by someone who didn't write the code. So nobody has to wait for the other person, the default bug hunter is a **fresh AI agent session** with no memory of building it. Paste this prompt:

> You are the bug hunter for phase `<ID>` of Lanyard. You did not write this code. Read `plans/<ID>-*.md` and `plans/00-README.md`. Then read the diff `git diff main...phase/<ID>-<slug>`. Work through the phase bug-hunt checklist item by item, actually running each check (tests, scripts, local chain, testnet calls, the app on an Android device or Expo web) rather than reasoning about it. Then try to break the phase's requirements in ways the checklist doesn't list. For every finding, add a row to this phase's findings table in `plans/TRACKER.md`: what you tried, what you expected, what happened, severity. Do not fix anything. Report the checklist items you could not run, and why.

The other person reads the findings when they get to them and can add rows. They re-run the riskiest items at the next integration checkpoint.

**Cross bug hunt (every integration checkpoint).** Both people, each attacking the **other** track's code through the newly integrated path. Findings go in that integration's section of `TRACKER.md`.

**Final cross bug hunt (I4).** Both people run the demo script end to end on two Android phones plus the web consoles, and try to break every pitch claim.

**Severity:**

- **High:** breaks a guarantee the pitch claims (e.g. the organizer can backdate, a revoked judge's score counts, verify prints MATCH on wrong data). Must be fixed before merge.
- **Medium:** breaks a feature. Fix it, or write it up in `README.md › Known limitations`, before merge.
- **Low:** cosmetic or rare. Fix if cheap, otherwise log it.

## Shared conventions

- **Networks.** ENS on Sepolia. Arkiv on Rabdi: chain ID `7794095`, RPC `https://rpc.rabdi.db-chain.testnet.arkiv.network`, 2 s blocks, tGLM gas.
- **RPCs.** The Rabdi RPC needs an access key in its URL; the keyless endpoint is heavily rate-limited (HTTP 429). With no backend, the app ships a **dedicated public app key** (free, from hub.arkiv.network) as `EXPO_PUBLIC_ARKIV_ACCESS_KEY`. Anyone can extract it and spend its quota (100M units; each query costs 10), so treat it as public and rotate it if it's abused. Scripts and the CLI use their own key from the local `.env`. Sepolia uses an **archive** RPC whose key is restricted to the app (Android package name and web origin). It ships in the bundle as `EXPO_PUBLIC_SEPOLIA_RPC_URL`.
- **Agent skills.** The Arkiv (SDK 1.0.x) and ENS skills are committed under `.claude/skills/` (pinned in `skills-lock.json`). Read the relevant skill before writing Arkiv or ENS code. Each person also installs the ethskills plugin themselves: `/plugin marketplace add austintgriffith/ethskills`, then `/plugin install ethskills@ethskills`.
- **Names.** Base `lanyard.eth`. Edition `mumbai2026.lanyard.eth`. Team `<team>.mumbai2026.lanyard.eth`. Winner `winner.<team>.mumbai2026.lanyard.eth`, created whenever a winner is declared.
- **Labels in code** are relative to the edition: `priya.volunteers`, `zkpay`, `ana.judges.arkiv.partners`.
- **Partners** are listed in `event.config.ts`: `arkiv` and `ens` for now. Adding one is a config and seed change, never a code change.
- **Pinned versions.** Exact versions in `package.json` for `@arkiv-network/sdk` (1.0.x, which the skills target), the Expo SDK, Reown AppKit and viem. ENSv2 contracts are pinned by commit in `foundry.toml`. No upgrades during the build.
- **Addresses** live in `deployments/sepolia.json` and `deployments/rabdi.json`. Nothing is hard-coded.
- **Secrets.** The organizer key, results key, desk wallet key (scripts only), score-decryption key and the CLI's Arkiv access key live only in the local `.env` of whoever runs the deploy, seed or freeze scripts. They never ship in the app. The only key-like values in the app are the public Arkiv app key and the app-restricted Sepolia RPC URL. Users' keys never leave their wallets. `.env` is git-ignored; `.env.example` is committed.
- **APK builds** always use `--local`.
- **Requirements style.** EARS: `WHEN <trigger>, THE <component> SHALL <response>`. IDs are per spec, e.g. `A1.2-R3`.
- **Teams** have at most 4 people, written Person A, Person B, Person C, Person D in fixtures and the demo. (Not to be confused with the two builders.)
- **Seats.** Everyone has an assigned seat. No QR stickers.

## Decisions

All decisions taken, and the ones still open, are listed in `00-CONTEXT.md` §13–14.
