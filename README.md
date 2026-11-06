# Lanyard

Event OS for hackathons on ENSv2 (Sepolia) and Arkiv (Rabdi), shipped as an Expo dApp for Android and web.

Start with [`plans/00-README.md`](plans/00-README.md), then [`plans/00-CONTEXT.md`](plans/00-CONTEXT.md). Progress lives in [`plans/TRACKER.md`](plans/TRACKER.md).

## Setup

```bash
git clone --recursive https://github.com/kronzter/lanyard.git
cd lanyard
nvm use            # Node 22
pnpm i
pnpm ci:local      # lint, typecheck, tests, forge test
```

Requires Foundry (`forge`). Agent skills for Arkiv and ENS are committed in `.claude/skills/`. Install the ethskills plugin yourself in Claude Code:

```
/plugin marketplace add austintgriffith/ethskills
/plugin install ethskills@ethskills
```

APK builds are always local: `eas build --platform android --profile <development|preview> --local`.

## Known limitations

None recorded yet.
