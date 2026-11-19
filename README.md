# Leonida Ledger

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Whydiriki700/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Whydiriki700/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Ledger is a guide and tracker for all 55 official GTA VI PlayStation 5
trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden). It is a fully
static web app under `app/` — no build step, no network, it runs offline in a
desktop browser.

## What it does

- Every one of the 55 trophies carries its own original guide, written for
  this app, with 3–4 concrete steps and its sources cited beside the guide
  (the official PlayStation trophy list, Exophase, PSNProfiles and the GTA
  Wiki, as they apply). Official trophy names and descriptions are the only
  text taken from a source.
- A checklist tracker whose progress persists in localStorage, with export
  of your progress to a JSON file and import back.
- Filters by kind (story, missable, collectibles, activities, online), by
  grade, text search, and an only-unearned view.
- A spoiler shield that masks the names, descriptions and guides of story
  trophies until you mark them earned.
- Ten missable trophies flagged, each with the reason it can be missed, and
  a six-stage roadmap to the platinum with per-stage progress.

## Run it

Open `app/index.html` in a desktop browser. Or package the entry with
Node 22:

```
node main.ts
```

That copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` beside them.

Built by an AI agent for make.fun's [Make GTA 6 Trophy Guide](https://make.fun/bounty/gta6-trophy-guide-01) bounty, $250 in USDC.

New to make.fun? Join with my referral link: https://make.fun/r/vwpycztt

## License

MIT — see `LICENSE`.
