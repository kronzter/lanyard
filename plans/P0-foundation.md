# P0 · Foundation (joint)

**Track:** both · **Branch:** `phase/P0-foundation` · **Depends on:** nothing

## Goal

Everything the two tracks must agree on, built once and together, so that afterwards neither person ever waits for the other. This is the **only** phase where both people commit to the same branch. Split the specs as marked, and pair on P0.3 and P0.6.

**Run P0.6 (the spike) first.** It decides how P0.5 wires up wallets, and whether any fallback is needed.

## Out of scope

Any real ENS, Arkiv or routing logic. Only the spike's throwaway code, shapes, stubs and fixtures.

---

### P0.6 · Wallet and chain spike · *pair, first*

Prove the stack works before anyone builds on it. Throwaway code goes in `spike/` and is deleted at the end of P0. The results are recorded in `TRACKER.md › Spike`.

**Checks**
- **S1** A local dev APK (`eas build --platform android --profile development --local`) with Reown AppKit installs on a real Android phone and connects MetaMask mobile over WalletConnect.
- **S2** The connected wallet adds Rabdi (chain `7794095`) with `wallet_addEthereumChain` and switches to it.
- **S3** The Arkiv SDK runs on Hermes, using AppKit's EIP-1193 provider as the signer: create one entity, read it back, and check `$owner` == the connected address. Record the exact polyfills needed.
- **S4** One `executeBatch` with two creates needs exactly one wallet approval.
- **S5** S2–S4 pass on Expo web too, through AppKit's wagmi adapter.
- **S6** A trivial contract deploys to Rabdi and can be called (this is what decides whether the faucet is feasible).
- **S7** From the phone, `getEnsText` works at a past Sepolia block through the archive RPC, using an app-restricted key.
- **S8** Load test from one device: 10 parallel `watchEntityEvents` subscriptions and 200 reads/min on the public Rabdi RPC. Also count the ENS reads `prepare` would need for 500 fixture records, with an on-device cache. Record any rate-limit errors and the ceiling found.

**Fallbacks**

| If | Then |
| --- | --- |
| S1–S5 fail with external wallets | Use AppKit's email/social-login wallet (stays on Reown) |
| S3 fails on Hermes even with polyfills | Stop and decide jointly before going further |
| S6 fails | The desk sends tGLM straight from the organizer wallet; the `Faucet` contract is dropped from B1.1 |
| S7 or S8 hit limits | Add a read-only cache service that holds no keys, signs nothing, and that `lanyard verify` bypasses |

**Done when** every check has pass/fail and notes in `TRACKER.md`, and any fallback is chosen and noted there.

**Commit:** `docs(tracker): P0.6 spike results`

---

### P0.1 · Repo skeleton and CI · *Person A*

**Requirements**
- **P0.1-R1** THE repo SHALL be a pnpm workspace with `packages/{shared,contracts,ens,venue,arkiv,faucet,rules,cli}`, `apps/app`, `fixtures`, `deployments`, `arkiv`, `e2e`, `plans`.
- **P0.1-R2** WHEN staged files contain a private key or mnemonic pattern, THE `pre-commit` hook SHALL reject the commit.
- **P0.1-R3** WHEN a pull request or a push to `main` happens, THE CI SHALL run lint, typecheck, `vitest`, `forge test` (both Foundry projects) and `expo export --platform web`.
- **P0.1-R4** THE `CODEOWNERS` file SHALL encode the path-ownership table in `00-README.md`.

**Tasks**
- [ ] Workspace, TypeScript base config, ESLint, Prettier
- [ ] Foundry project in `packages/contracts`, with ENSv2 contracts pinned by commit
- [ ] Foundry project in `packages/faucet` (Rabdi)
- [ ] Husky `pre-commit`: secret scan + lint-staged
- [ ] GitHub Actions workflow; `pnpm ci:local` runs the same steps
- [ ] `CODEOWNERS`, `.env.example`, `.gitignore` (`.env`, `android/`, `*.apk`, `spike/`)
- [ ] Symlink `AGENTS.md` and `CLAUDE.md` at the repo root to `plans/00-CONTEXT.md`

**Done when** a fake key is rejected locally and CI is green on an empty test.

**Commit:** `build: P0.1 repo skeleton, hooks and ci`

---

### P0.2 · Shared types, event config, deployments schema · *Person B*

**Requirements**
- **P0.2-R1** THE `event.config.ts` SHALL hold the base name, the edition label, the partner list (`arkiv`, `ens`), and the event's key times (event start, event end, submission deadline, judging end, results) as Unix seconds.
- **P0.2-R2** THE shared `Venue` types SHALL describe the image size, cell size, walkable cells (run-length encoded), seats, points of interest (with a `kind`, including `help-desk`) and zones, matching the `venue.json` format A3.1 exports.
- **P0.2-R3** WHEN `deployments/sepolia.json` or `deployments/rabdi.json` is loaded, THE shared loader SHALL validate it against a schema and fail loudly on missing addresses.
- **P0.2-R4** THE shared `labels.ts` SHALL convert between relative labels (`priya.volunteers`) and full names (`priya.volunteers.mumbai2026.lanyard.eth`), normalizing with ENSIP-15.
- **P0.2-R5** THE shared package SHALL import nothing Node-only, so it runs on Hermes, in the browser, and on Node.

**Tasks**
- [ ] `packages/shared/src/event.config.ts`
- [ ] `types/venue.ts`: `Venue`, `Cell`, `CellRef`, `Seat`, `Poi`, `Zone`, `OpenTicket`
- [ ] `deployments/schema.ts` (zod), plus empty-but-valid `deployments/sepolia.json` and `deployments/rabdi.json` with placeholders
- [ ] `labels.ts` with tests (mixed case, trailing space and emoji rejected)

**Done when** both people can import every type and the loader rejects a broken deployments file.

**Commit:** `feat(shared): P0.2 shared types, event config and deployments schema`

---

### P0.3 · Interfaces, mocks, conformance suites · *pair*

```ts
// packages/shared/src/interfaces/ens-reader.ts
export type Label = string; // relative to the edition, e.g. "priya.volunteers"
export interface EnsReader {
  resolve(label: Label, at: { sepoliaBlock: bigint }): Promise<Address | null>;
  text(label: Label, key: string, at: { sepoliaBlock: bigint }): Promise<string | null>;
  expiry(label: Label, at: { sepoliaBlock: bigint }): Promise<bigint | null>;
  sepoliaBlockAt(unixSeconds: bigint): Promise<bigint>; // latest block with timestamp <= t
  headBlock(): Promise<bigint>;
}

// packages/shared/src/interfaces/router.ts
export interface Router {
  path(v: Venue, from: CellRef, to: CellRef): Cell[] | null;
  distances(v: Venue, from: CellRef): Map<string, number>; // metres, key = "x,y"
  nextTicket(v: Venue, from: CellRef, open: OpenTicket[], alpha: number): OpenTicket | null;
  judgeRoute(v: Venue, start: CellRef, stops: string[]): string[]; // project keys in visit order
}

// packages/shared/src/interfaces/results-publisher.ts
export interface ResultsPublisher {
  setEventResults(resultsKey: Hex): Promise<{ txHash: Hex }>;
  declareWinner(input: { team: string; prizes: string[]; resultsKey: Hex; resultsHash: Hex }): Promise<{ txHash: Hex }>;
  lockResults(): Promise<{ txHash: Hex }>;
}
```

**Requirements**
- **P0.3-R1** THE `MockEnsReader` SHALL answer from `fixtures/ens-history.json` by replaying events up to the requested block.
- **P0.3-R2** THE `StubRouter` SHALL use Manhattan distance and straight-line paths, ignoring walls.
- **P0.3-R3** THE `MockResultsPublisher` SHALL record calls in memory, refuse a second `declareWinner` for the same team, and refuse every call after `lockResults`.
- **P0.3-R4** THE `runEnsReaderConformance`, `runRouterConformance` and `runResultsPublisherConformance` suites SHALL be exported from `packages/shared/testing`, and each mock SHALL pass its suite.
- **P0.3-R5** WHEN a deliberately broken mock (e.g. `resolve` ignores the block) is run against its suite, THE suite SHALL fail.

**Conformance suites must check at least**
- `EnsReader`: a name resolves only between its register and unregister blocks; `text` reflects the value set at or before the block; a badge is expired at exactly its `expiry` second; `sepoliaBlockAt` picks the earlier of two blocks.
- `Router`: path endpoints are the requested cells; `nextTicket` returns `null` on an empty list; ties are broken by lowest ticket key; `judgeRoute` returns each stop exactly once. (Grid-only checks, such as never crossing a blocked cell, live in A3.2's own tests.)
- `ResultsPublisher`: declaring twice fails; anything after lock fails.

**Tasks**
- [ ] Three interface files
- [ ] Three mocks
- [ ] Three conformance suites, each with a broken-mock self-test

**Done when** `pnpm test --filter shared` runs nine green suites and three self-tests that are meant to fail, and do.

**Commit:** `feat(shared): P0.3 interfaces, mocks and conformance suites`

---

### P0.4 · Shared fixtures · *Person B*

**Requirements**
- **P0.4-R1** THE `fixtures/personas.json` SHALL list every demo actor with their label, book, address, and the env var holding their key for local seed and e2e scripts: organizer, results key, volunteer coordinator, head judge, two partners (`arkiv`, `ens`) with two staff each, four leads, ten volunteers, six judges (three per partner), and teams of up to four (Person A–D).
- **P0.4-R2** THE `fixtures/venue.small.json` SHALL be a hand-made 20×12 grid with 12 seats, 2 zones, 3 points of interest (one `help-desk` per zone, plus a stage) and one walled-in seat.
- **P0.4-R3** THE `fixtures/ens-history.json` SHALL script a day of ENS events at Sepolia blocks, including: badges issued; Priya made lead; Priya's lead note removed at a known block; one judge unregistered mid-judging; one badge reaching expiry; one expired badge revived.
- **P0.4-R4** THE `fixtures/timeline.json` SHALL map the event's key times to mock Sepolia blocks (12 s per block from a fixed genesis).

**Tasks**
- [ ] Four fixture files, each with a short header comment explaining the story
- [ ] A test that every `by` label used in fixtures exists in `personas.json`

**Commit:** `chore(fixtures): P0.4 personas, small venue, ens history and timeline`

---

### P0.5 · App shell · *Person A*

Uses the wallet setup proven in P0.6, or its fallback.

**Requirements**
- **P0.5-R1** THE app SHALL be Expo (pinned SDK) + Expo Router + TypeScript at `apps/app`, with route folders created for each owner as in `00-README.md`, each holding a placeholder screen that says which phase fills it.
- **P0.5-R2** THE `eas.json` SHALL define a `development` profile (dev client APK) and a `preview` profile (installable APK). `pnpm app:apk` and `pnpm app:dev-apk` SHALL run `eas build --platform android --profile <p> --local`. No script runs a cloud build.
- **P0.5-R3** THE shell SHALL wrap Reown AppKit (native SDK on Android, wagmi adapter on web) behind one `useWallet()` hook that exposes the address, the chain, a viem wallet client, and an EIP-1193 provider for Sepolia and Rabdi.
- **P0.5-R4** THE `flags.ts` SHALL read `EXPO_PUBLIC_LANYARD_ENS` and `EXPO_PUBLIC_LANYARD_ROUTER`, and `providers.ts` SHALL return the mock or real implementation for each.
- **P0.5-R5** THE stub `<VenueMap>` SHALL draw the floor-plan image, seat dots and a straight path with `react-native-svg`, with the props A3.3 will keep: `venue`, `highlight`, `path`, `onSeatTap`.
- **P0.5-R6** THE shell SHALL show the connected address's resolved label, through whichever `EnsReader` the flag picks.
- **P0.5-R7** WHEN a web-only screen (organizer, ENS consoles, venue editor) is opened on Android, THE shell SHALL show "Open on web" instead of the screen.

**Tasks**
- [ ] App scaffold, Expo Router layout, Hermes polyfills from P0.6
- [ ] AppKit + `useWallet()` on Android and web
- [ ] `eas.json`, the local APK scripts, and a `preview` APK installed on both builders' phones
- [ ] `flags.ts` and `providers.ts`
- [ ] Stub `<VenueMap>` with the fixed props
- [ ] Web-only route guard and placeholder screens

**Commit:** `feat(app): P0.5 expo app shell with appkit, flags and stub map`

---

## Phase bug hunt (the two people swap specs)

- [ ] A staged file containing a 64-hex private key is rejected
- [ ] Each broken mock really does fail its conformance suite
- [ ] `MockEnsReader`: Priya's lead note is present one block before its removal and gone at the removal block
- [ ] `labels.ts` rejects `Judges`, `judges ` and an emoji label
- [ ] `CODEOWNERS` assigns every path in the ownership table, and nothing is unowned
- [ ] Fresh clone: `pnpm i && pnpm ci:local` passes with no `.env`
- [ ] The web export and the preview APK contain no `.env` value other than `EXPO_PUBLIC_*` ones
- [ ] `pnpm app:apk` builds locally on both laptops; nothing ever calls a cloud build
- [ ] A web-only route opened on Android shows "Open on web"
- [ ] The shell connects on Android and on web, and shows the mock-resolved label

## Phase done when

- [ ] All six specs are marked done in `TRACKER.md`
- [ ] Bug hunt run, Highs fixed with regression tests, Mediums fixed or in Known limitations
- [ ] `spike/` deleted
- [ ] Merged into `main`; both people branch their first phase from it
