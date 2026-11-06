# A4 · Winner names and ENS consoles

**Track:** A · **Branch:** `phase/A4-winners-consoles` · **Depends on:** A1–A3 · **Integration:** I4

## Goal

Whenever a winner is declared, the team gets a permanent name:

```
winner.<team>.<edition>.<base>
e.g. winner.zkpay.mumbai2026.lanyard.eth
```

Once it's issued, nobody can change what it says, including the organizer and the team. This phase also ships the ENS-side consoles staff use on the day, as web-only screens signed by each staff member's own wallet.

## Out of scope

Computing who won, and the prize rules (B4 and `00-CONTEXT.md` §14: TBD). The Arkiv results record (B4). This phase ships the contract and a real `ResultsPublisher` that B4's freeze CLI calls.

---

### A4.1 · `WinnerRegistrar`

**Requirements**
- **A4.1-R1** WHEN `declare(team, prizes, resultsKey, resultsHash)` is called by the results key, THE `WinnerRegistrar` SHALL:
  1. promote the reserved `winner` label in the team subregistry (A1.3) to registered, owned by the team lead, with resolver = results resolver, roles = none, expiry = far future;
  2. renew the team name in the edition registry to far future (a child stops resolving when its parent expires);
  3. write these records on the results resolver for `winner.<team>…`: `lanyard.prizes` (the comma-joined prize strings passed in), `lanyard.results` (the Arkiv results key), `lanyard.results-hash`, and `lanyard.edition` = `mumbai2026`.
- **A4.1-R2** WHEN `declare` is called twice for the same team, or by any other account, THE `WinnerRegistrar` SHALL revert.
- **A4.1-R3** WHEN anyone other than `WinnerRegistrar` tries to register or promote `winner`, THE team subregistry SHALL revert.
- **A4.1-R4** WHEN a team wins several prizes, THE system SHALL issue one name with every prize listed.
- **A4.1-R5** WHEN `WinnerRegistrar` is deployed, THE organizer SHALL call `setWinnerRegistrar`, plus `backfillWinnerRoles` for teams registered before it existed.
- **A4.1-R6** THE contract SHALL treat prize strings as opaque input (≤ 128 bytes each). Which teams win, and what the prizes are called, is decided outside it.

**Commit:** `feat(contracts): A4.1 WinnerRegistrar declaring permanent winner names`

---

### A4.2 · Results lock and `SepoliaResultsPublisher`

**Requirements**
- **A4.2-R1** THE `setEventResults` SHALL write `lanyard.results` on the edition name through the event resolver.
- **A4.2-R2** WHEN `lockResults` is called, THE results key SHALL revoke `ROLE_SET_TEXT`, `ROLE_LINK` and `ROLE_UPGRADE`, each with its admin role, from every holder on the results resolver, so any later `setText` reverts for everyone.
- **A4.2-R3** THE `SepoliaResultsPublisher` SHALL implement `ResultsPublisher` and pass `runResultsPublisherConformance` on a Sepolia fork.
- **A4.2-R4** THE `SepoliaResultsPublisher` SHALL be used only by the local freeze CLI, with the results key from that machine's `.env`. It SHALL never be imported by `apps/app`.

**Commit:** `feat(ens): A4.2 results lock and SepoliaResultsPublisher`

---

### A4.3 · ENS consoles

**Screens.** All of these are web-only, under `/admin/ens/*`, except `<WinnerBadge>`. Every transaction is signed by the connected staff wallet through AppKit; no key lives in the app.
- **Onboarding desk** (organizer): scan the holder's address QR (camera) or paste it, pick a book, and send `registerBadge`; register teams to the lead's address. (Dripping tGLM is B's `/organizer/faucet` screen, linked from the desk.)
- **Coordinator:** make or unmake a lead (writes `lanyard.perms`, A2.2).
- **Partner console:** issue and revoke that partner's judges and staff (A2.2, A2.3).
- **Permission map:** every grant, read live from `EACRolesChanged` events.
- **Winner badge:** `<WinnerBadge label>`, on the team screen and hacker profile, read through the Universal Resolver. Works on Android and web. Exported for B's team screen.

**Requirements**
- **A4.3-R1** WHEN a console action succeeds, THE screen SHALL show the transaction hash and the Sepolia block.
- **A4.3-R2** WHEN the connected wallet lacks the role, THE screen SHALL say so before sending, by reading roles on-chain.
- **A4.3-R3** THE permission map SHALL match `roleCount`/`hasRoles` reads for every listed resource.
- **A4.3-R4** WHEN the connected wallet is on the wrong chain, THE console SHALL ask the wallet to switch to Sepolia before sending.

**Commit:** `feat(app): A4.3 onboarding desk, coordinator, partner and permission consoles`

---

## Phase bug hunt

- [ ] A team lead calls `register('winner', …)` in their own subregistry before freeze: reverts
- [ ] A team lead tries to unregister the reservation: reverts
- [ ] A random account calls `declare`: reverts
- [ ] `declare` twice for one team: reverts
- [ ] After lock, the organizer and the results key both fail to `setText` on the results resolver
- [ ] Let a test team's name expire without the renew step: `winner.<team>…` stops resolving; with the real flow it keeps resolving
- [ ] The winner name can't be transferred and has no set-resolver role
- [ ] A team registered before `WinnerRegistrar` existed can still be declared after backfill
- [ ] Mixed-case or look-alike team labels are normalized before `declare`
- [ ] Search the web export and the APK for the results key and the organizer key: absent; `apps/app` doesn't import `SepoliaResultsPublisher`
- [ ] Coordinator console with a non-coordinator wallet connected: blocked before sending
- [ ] Desk with a wallet on Rabdi instead of Sepolia: asks to switch, sends nothing on the wrong chain
- [ ] Permission map vs direct `hasRoles` reads: identical

## Phase done when

- [ ] A4.1–A4.3 marked done in `TRACKER.md`
- [ ] `SepoliaResultsPublisher` passes conformance
- [ ] Bug hunt run; Highs fixed with regression tests; Mediums fixed or in Known limitations
- [ ] The README states honestly: "forever" is only as permanent as `lanyard.eth`'s own renewal
- [ ] Merged into `main`
