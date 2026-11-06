# Git workflow

Two people build side by side. Each phase is a branch, each spec is a commit, and finished phases merge into `main`. That's it.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Always builds and passes `pnpm ci:local`. Receives merges only |
| `phase/<ID>-<slug>` | One phase, e.g. `phase/A1-namespace`, `phase/B3-volunteers-tickets` |
| `int/<ID>-<slug>` | One integration checkpoint, e.g. `int/I2-real-ens-history` |
| `fix/<slug>` | A High found at an integration in code that's already merged. The track owner makes it off `main` |

No direct commits to `main`.

## Commits

**One commit per spec.** When a spec's requirements pass, commit everything for that spec, including its `TRACKER.md` status row.

```
<type>(<scope>): <spec ID> <what it does>

feat(ens): A1.2 badge books and LanyardRegistrar
feat(app): P0.5 expo app shell with appkit and flags
feat(rules): B3.1 on-duty rules, shifts and clocks
```

- Conventional Commit style: `feat`, `fix`, `test`, `refactor`, `build`, `ci`, `chore`, `docs`. Pick the scope by what the spec mostly touches. This isn't enforced by a hook.
- **Bug-hunt fixes:** one commit per finding, with the regression test in the same commit: `fix(contracts): A1 reject team label with trailing hyphen`.
- **Interface additions** go in their own commit that touches only `packages/shared` (plus the mock), and get logged in `TRACKER.md`.
- **Tracker-only updates** (e.g. logging bug-hunt findings): `docs(tracker): A1 bug hunt findings`.
- Every commit on a phase branch builds.
- Never commit `.env`, private keys or mnemonics. The `pre-commit` secret-scan hook (P0.1) rejects them.
- Plan files (`plans/*.md` except `TRACKER.md`) are never changed on a phase branch.

## Finishing a phase

```bash
# bug hunt done, Highs fixed, findings + status recorded in plans/TRACKER.md
git fetch origin
git merge origin/main      # paths are disjoint, so this is clean (re-run pnpm i if the lockfile conflicts)
pnpm ci:local              # lint, typecheck, unit tests, forge test, web export
git switch main && git pull
git merge phase/A1-namespace
git push origin main
git branch -d phase/A1-namespace
```

## Integration branches

```bash
git switch -c int/I2-real-ens-history origin/main   # both phases already merged
```

An integration branch may touch only: `packages/shared`, `fixtures`, `apps/app/app/_layout.tsx`, `apps/app/src/shell/**`, `apps/app/src/flags.ts`, `apps/app/src/providers.ts`, `apps/app/app.json`, `apps/app/eas.json`, `.env.example`, `deployments`, `e2e`, `README.md`, and that integration's section of `plans/TRACKER.md`. One commit per integration step.

If a bug turns up in a track's own code during an integration, the **track owner** fixes it on `fix/<slug>` off `main` (fix + regression test in one commit), merges it, and the integration branch merges `main` again.

## APK builds

Always local:

```bash
eas build --platform android --profile development --local   # dev client
eas build --platform android --profile preview --local       # installable APK for demos
```

Never run `eas build` without `--local`.

## Never

- Force-push `main`.
- Merge a phase that has an open High.
- Commit to another person's paths on your phase branch.
- Commit messages like "wip", "fix stuff", "final", "final2".
