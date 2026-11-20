# Leonida Trophy Atlas

[![bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Whydiriki700/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Whydiriki700/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5,
built for the make.fun bounty
[gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What is inside

- **All 55 official trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze —
  each with its official name, description and grade exactly as PlayStation
  publishes them, and 28 of them flagged hidden, as on PlayStation.
- **An original guide for every trophy**, written for this atlas: what to do,
  where and how, in three to four concrete steps, with its sources named
  beside it (Exophase, PSNProfiles, PowerPyx, IGN, the GTA Wiki). Seven
  trophies whose triggers no official source documents are marked honestly
  as **unconfirmed**, with the best-supported community reading instead of
  invented certainty.
- **One missable trophy, flagged**: *Positive Mental Attitude*. The entry
  explains why — meditation spots sit at story locations the campaign
  permanently alters, and there is no chapter select — and the roadmap
  sweeps the spots region by region before that can bite.
- **A six-stage roadmap to the platinum**: story and chapters first, the
  stranger strands, the heist set pieces and final mission, then the counted
  sweep (250 stunts, 42 shooting-range golds, 100 WAiNK spots and the rest),
  and finally 100% completion.
- **A working tracker**: a checklist whose progress is saved in the
  browser's local storage, per-trophy counters for the counted trophies,
  export of your progress to a JSON file and import back, and filters by
  kind (story, missable, collectibles, activities, online), by grade and by
  earned status, plus full-text search.
- **A spoiler shield**, on by default: hidden trophies show as "Hidden
  Trophy" — name, description and guide sealed in the list, the detail
  panel, search results and the roadmap — until you earn them or choose to
  reveal them.

## Run it

The app is plain static files under `app/` with no build step. Serve the
folder with any static server, for example the bundled one:

```
node serve.ts            # then open http://localhost:8080
```

It works fully offline: the app loads nothing over the network, and your
progress never leaves your browser.

## Hand it in

`node main.ts` copies `app/` and `screenshots/` to the output directory
(`MAKEFUN_OUTPUT_DIR` outside the grader) and writes `dossier.json` with
the vendored make.fun library in `vendor/makefun-frontend.ts`, which is the
kit's copy, unchanged.

## Credit

Built for a make.fun bounty. If you found this atlas useful, the referral
link of the builder is https://make.fun/r/vwpycztt.

Trophy names and descriptions are as PlayStation publishes them; this is an
unofficial fan guide with no Rockstar Games artwork or logos.
