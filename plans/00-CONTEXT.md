# Lanyard · Master context

This one page tells anyone (either builder, or a fresh AI agent session) everything they need before touching the repo. If this file and a phase file disagree, the phase file wins for that phase's details. Plan files are frozen during development; progress lives in `plans/TRACKER.md`.

**Linked into the repo root as `AGENTS.md` and `CLAUDE.md`** (symlinks to `plans/00-CONTEXT.md`, set up in P0.1), so every agent session loads it automatically.

## 1 · What we're building

**Lanyard** is an event operating system for hackathons, built first for the `mumbai2026` edition. It's an **Expo dApp** (Android and web) with **no backend**, and it joins two chains:

- **ENSv2 on Sepolia** gives everyone a role that expires: badges, permissions, team names, permanent winner names.
- **Arkiv on Rabdi** holds everything people do: shifts, clock-ins, help tickets, submissions, scores, results. Records are owned, timestamped and expire on their own.

**The one-line trust model.** Arkiv decides **who can edit** a record (its owner). ENS decides **whether it counts** (the writer held the right badge at that moment). A pure rules function joins the two, and anyone can rerun it with `lanyard verify`.

## 2 · Features

| # | Feature | In short | Phases |
| --- | --- | --- | --- |
| 1 | Volunteer management | A badge for the whole event. Any lead (ENS note `shift-manager`) writes shifts and clock-ins on Arkiv. The duty pass expires at shift end | A1, A2, B3 |
| 2 | Help tickets + venue | A grid over the floor-plan image. A hacker raises a ticket from their assigned seat; the nearest on-duty helper claims it, walks the drawn path, and gets the best next ticket. Partner-help tickets go to that partner's staff | A3, B3 |
| 3 | Judging | Partners judge their own tracks. Teams own their submissions. Scores stay sealed until freeze, and results can be recomputed by anyone. Winners get `winner.<team>.<edition>.<base>` | A4, B4 |

## 3 · App, wallets, chains

- Expo + Expo Router at `apps/app`. **Android** (locally built dev or preview APKs: `eas build --platform android --profile <p> --local`, never in the cloud) and **web**. The code stays iOS-compatible but is never built.
- Dev builds only. Expo Go can't load Reown AppKit's native modules.
- **Reown AppKit**: the native SDK on Android, the wagmi adapter on web, both behind one `useWallet()` hook. Chains: Sepolia and Rabdi. The fallback, if P0.6 fails for external wallets, is AppKit's email/social-login wallet.
- **No backend.** All actions are signed by the actor's own wallet in the app. Deploy, seed and freeze are local scripts and CLIs, with keys in the operator's local `.env`.
- Field screens (hacker, volunteer, lead, judge, team) are for phones. Organizer screens, ENS consoles and the venue editor are **web-only**: on Android they show "Open on web".
- Venue map: `react-native-svg` + `react-native-gesture-handler` + `react-native-reanimated`, the same component on native and web.
- `packages/rules` is pure TypeScript that runs unchanged on Hermes (in the app) and Node (in the CLI).
- **Gas.** Only staff send Sepolia transactions: organizer, coordinator, head judge, partners and the results key. Everyone else only reads ENS. Everyone who writes to Arkiv gets tGLM once, dripped by the onboarding desk from the `Faucet` contract on Rabdi.

## 4 · Names

```
lanyard.eth                                   base (organizer)
└── mumbai2026.lanyard.eth                    edition registry, EMANCIPATED
    ├── hackers | judges | volunteers | partners
    │                                         books: organizer-owned, MANAGED registries
    │   └── <partner>.partners
    │       ├── judges.<partner>.partners     that partner's judges
    │       └── staff.<partner>.partners      that partner's booth staff (answer partner tickets)
    └── <team>.mumbai2026.lanyard.eth         team names, owned by team leads
        └── winner.<team>…                    reserved at team registration,
                                              promoted only by WinnerRegistrar
```

- In code, labels are **relative to the edition**: `priya.volunteers`, `zkpay`, `ana.judges.arkiv.partners`, `sam.staff.ens.partners`.
- The organizer issues every book badge and every team name **directly** at the onboarding desk (scan or paste the holder's address). There are no vouchers.
- Winner names are created **every time a winner is declared**: one name per team, listing all its prizes.
- Teams have at most four people, written Person A–D in fixtures and the demo.

## 5 · Who can do what (ENS)

| Account | Can |
| --- | --- |
| Organizer | Register, unregister, renew and set resolver on every managed book; issue badges and register teams through `LanyardRegistrar`; onboard partners |
| `LanyardRegistrar` | Register and renew on the edition and the books; one-shot `setWinnerRegistrar` |
| Head judge | Register and unregister in `judges` only |
| Each partner | Register and unregister in its own `judges.<partner>` and `staff.<partner>` sub-books only |
| Volunteer coordinator | `setText` for key `lanyard.perms` only, on the staff resolver |
| Results key | Text records on the results resolver until lock; calls `WinnerRegistrar.declare`. Used only by the freeze CLI |
| Team lead | Set resolver and renew on their own team name; register member names in their own team registry. Can't touch `winner` |

Badges can't be transferred (there is no transfer-admin role). Revoke = `unregister()`. Reviving an expired badge = registrar `renew()` (same owner, same roles).

## 6 · Records (Arkiv)

Every record has `app: "lanyard"`, `event: "mumbai2026"`, `kind` and `by` (the writer's relative ENS label). The full table, with owners, flags and expiries, is in `B1-arkiv-data.md`.

Kinds: `venue`, `seat_assignment`, `shift`, `clock`, `duty_pass`, `ticket`, `ticket_claim`, `ticket_resolution`, `project`, `submission`, `acceptance`, `rubric`, `judge_assignment`, `score_sheet`, `final_score`, `recusal`, `results`.

Every app write is signed by the user's wallet through AppKit. Use `executeBatch` wherever records belong together: one batch is one wallet approval.

## 7 · Rules that matter most

- A record counts only if: the writer matches the kind's required owner; `by` resolved to the writer **at the record's block time**; the badge was unexpired, not unregistered, and carried any needed note; and the kind's own condition holds.
- Time chain: Arkiv `$createdAt` block → its timestamp → the latest Sepolia block with timestamp ≤ that → ENS reads at that block (archive RPC).
- Rules are **pure**: no clock, randomness or network inside. Integer maths, stable sort, ties broken by earliest block, then lowest record key.
- Records that fail are shown greyed out with a reason, never hidden.
- **On duty at T** = badge valid at T **and** (a shift covers T with no later valid clock-out, **or** the latest valid clock before T is `in`). A volunteer can clock themselves in only within 60 min before a shift.
- **Tickets:** 4 h expiry. A claim lasts 15 min. The earliest claim by block wins. At most 3 open tickets per hacker. Partner-help tickets can be claimed only by holders of that partner's `staff` badges. Medical or safety issues are never tickets: the app shows the staff phone number and the help desk. A helper's position starts at their zone's help-desk POI when they clock in, then moves to each seat they resolve. Next-ticket score: `walking_metres − 5 × minutes_waiting`, lowest wins.
- **Judging:** one submission per team, from the team lead only. The earliest valid one before the deadline counts; later ones are shown as duplicates. Late submissions are excluded. The organizer can't patch projects. Cross-track scores are rejected. A revoked judge loses **all** their scores. The earliest final per judge per project counts. Scores stay sealed to the event public key until freeze. Ranking uses the **raw weighted mean** per track.
- **Freeze order** (local CLI): record both head blocks → decrypt → rules → `results` record → `setEventResults` → `declareWinner` per winning team → `lockResults`. It runs once and can be resumed. The prize rules are TBD (§14).

## 8 · How the two tracks stay independent

- **Person A · ENS & venue:** `packages/{contracts,ens,venue}`, `apps/app/app/admin/ens/*`, `apps/app/app/venue/*`, `apps/app/src/components/venue/*`.
- **Person B · Arkiv & flows:** `packages/{arkiv,faucet,rules,cli}`, `arkiv/`, `apps/app/app/{volunteer,lead,tickets,judge,team,organizer}/*`.
- **Shared** (`packages/shared`, fixtures, app shell, flags, providers, app config): built together in P0. After that, only additive changes, each in its own commit and logged in `TRACKER.md`.
- Interfaces: `EnsReader` (real in A2.4), `Router` (real in A3.2), `ResultsPublisher` (real in A4.2). Each has a mock and a conformance suite.
- Flags: ENS mock→sepolia at I2 · router stub→grid at I3 · results mock→sepolia at I4.
- Never import another track's package directly. Go through the `packages/shared` interfaces and `apps/app/src/providers.ts`.

## 9 · Phase order

| Step | Track A | Track B |
| --- | --- | --- |
| 0 | P0 Foundation (joint, P0.6 spike first) | P0 Foundation (joint) |
| 1 | A1 Namespace | B1 Arkiv data + faucet |
| ↳ | I1 Names meet records | I1 |
| 2 | A2 Permissions + EnsReader | B2 Rules + verifier |
| ↳ | I2 Real ENS history | I2 |
| 3 | A3 Venue + routing | B3 Volunteers + tickets |
| ↳ | I3 Real venue + router | I3 |
| 4 | A4 Winners + consoles | B4 Judging + freeze |
| ↳ | I4 Full demo + final bug hunt | I4 |

There are no time windows. Each integration runs when both of its phases are merged, and never blocks the next phase.

## 10 · Working rules (short version)

Full detail is in `00-README.md` and `00-git-workflow.md`.

- One branch per phase, `phase/<ID>-<slug>`, and one per integration, `int/<ID>-<slug>`. Plain merges into `main`.
- **One commit per spec.** Fixes from a bug hunt get one commit per finding, with the regression test included.
- A bug hunt after **every** phase, by someone who didn't write it (by default a fresh agent session; the prompt is in `00-README.md`). Highs are fixed before merge.
- Plan files are frozen. Progress goes in `plans/TRACKER.md`, where each person edits only their own track's section.
- APK builds always use `--local`.

## 11 · Pitfalls we already know about

**ENSv2**
- Token IDs change whenever roles change. Always look names up by **label hash**.
- A key-scoped resolver role reaches **every name on that resolver**. That's why staff names have their own resolver.
- A role can have at most 15 holders per resource.
- No `setApprovalForAll` on badges, ever.
- A child name stops resolving when its parent expires, so winners need their team name renewed.
- Emancipation can't be undone. Check `isEmancipated()` and the root role holders, including `ROLE_UPGRADE`.

**Arkiv**
- `readonly` and `permissionlessExtension` are fixed when a record is created.
- Expiry fires **no event**: compare `$expiresAt` with the current block.
- Extensions can only move expiry later, counted from now. The maximum lifetime is 7,884,000 blocks (≈182.5 days).
- Limits: 32 attributes, 128-byte strings, 128 KiB payload, 100 rows per page.
- The node rejects `!=`. Never use `ne()`/`not()`; model status positively.
- `executeBatch` is atomic and runs in order: creates → patches → deletes → extensions → ownership changes.
- The SDK renamed `expires` → `expiration`. The version is pinned; don't upgrade.
- The public RPC is rate-limited and there's no access key (no backend). P0.6 measures the limits; cache reads on the device.

**Expo, AppKit, wallets**
- No Expo Go. Use local dev builds.
- Every `EXPO_PUBLIC_*` value is inlined into the bundle. Never put a key there.
- viem and the Arkiv SDK need polyfills on Hermes (at least `crypto.getRandomValues`). P0.6 pins the exact set.
- With an external wallet, every transaction is a switch to the wallet app. Batch writes, and make the write queue survive the app going to the background.
- The wallet must add Rabdi (`wallet_addEthereumChain`) before the first Arkiv write.
- Local APK builds need the Android SDK and JDK on the builder's machine.

**General**
- The organizer key, results key and score-decryption key exist only in the local `.env` of whoever runs the scripts or CLI. They never ship in the app.
- ENS reads at a past block need an **archive** RPC. If the RPC fails, throw; never return "no name".

## 12 · Glossary

| Term | Meaning |
| --- | --- |
| Badge | An ENS name in a book, e.g. `priya.volunteers…`. Proves a role until it expires or is unregistered |
| Book | One of the four managed registries under the edition (hackers, judges, volunteers, partners) |
| Sub-book | A partner's `judges.<partner>` or `staff.<partner>` registry, managed by that partner |
| Note | A text record such as `lanyard.perms`, set through a key-scoped role |
| Lead | A volunteer whose `lanyard.perms` note includes `shift-manager` |
| Duty pass | An Arkiv record that expires exactly at shift end. Display only |
| Claim | A `ticket_claim`: a 15-minute hold on a ticket |
| Onboarding desk | The web console where the organizer issues badges and teams (A4.3) and drips tGLM (B1.1) |
| Faucet | Contract on Rabdi, funded by the organizer, that sends a fixed amount of tGLM once per address |
| Results key | The wallet the freeze CLI uses to publish results and declare winners |
| Freeze | The one-time local pipeline that publishes results and winner names |
| Verify | `lanyard verify mumbai2026`: recomputes everything at the recorded blocks and prints `MATCH` |
| Conformance suite | Tests that every implementation of an interface must pass, mock and real alike |

## 13 · Decisions taken

| Question | Decision |
| --- | --- |
| Edition label | `mumbai2026` |
| App | Expo + Expo Router, Android + web; iOS-compatible but never built |
| APK builds | Always local (`eas build --local`) |
| Wallets | Reown AppKit with external wallets; fallback to AppKit email/social login if P0.6 fails |
| Backend | None. A read-only cache (no keys, signs nothing) only if P0.6 shows the RPC limits can't be lived with |
| Badge issue | The organizer issues directly at the desk; no vouchers |
| Team registration | The organizer registers teams at the desk, to the lead's address |
| tGLM for users | On-chain `Faucet` contract on Rabdi; the desk calls `drip` |
| Books | Four: hackers, judges, volunteers, partners. Mentors and agents are cut |
| Partners | `arkiv`, `ens`, config-driven; a third partner may be added later |
| Partner ticket helpers | `staff.<partner>.partners` sub-book |
| Submissions | One per team; the earliest valid one before the deadline counts |
| Scoring | Raw weighted mean per track only |
| Sealed scores | Kept; the decryption key lives only in the freeze CLI's local env and is published in the results record at freeze |
| A revoked judge's scores | **All** of that judge's scores stop counting, earlier ones included |
| Seating | Everyone has an assigned seat |
| QR stickers | Not available; the venue is a grid over the floor-plan image |
| Helper start position | Their zone's help-desk POI when they clock in |
| Progress tracking | `plans/TRACKER.md`; plan files are frozen |

## 14 · Open (TBD)

| Question | Status |
| --- | --- |
| Prize rules: how many places per track, prize names, how the leaderboard maps to prizes | Not decided. Until it is, the freeze CLI and `declareWinner` take the winning teams and prize strings as an input file (`fixtures/prizes.json`) |
| Third partner | Will be added later as a config and seed change |
