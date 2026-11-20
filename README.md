# Leonida Trophy Atlas

[![bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Whydiriki700/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Whydiriki700/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5, built for the make.fun bounty gta6-trophy-guide-01. It covers all 55 official trophies: 1 platinum, 2 gold, 6 silver and 46 bronze, 28 of them hidden.

## What it does

- Full checklist of the 55 trophies with official names, descriptions and grades.
- A guide for every trophy written in this atlas's own words, with concrete steps and cited sources per trophy. Cryptic trophies whose method is not publicly confirmed are marked honestly as unconfirmed instead of getting invented instructions.
- Exactly one missable flag: Positive Mental Attitude, with the reason written out, plus a missable watch box in the roadmap.
- A six stage platinum roadmap built from the official descriptions: story spine, stranger strands, the missable sweep before the finale, counted grinds and collections, crime and the money game, then 100 percent.
- Tracker features: check off earned trophies, progress and per-grade counters, persistence in localStorage, and export/import of progress as JSON.
- Filters by kind (story, activities, collectibles, exploration, combat and crime, money and property), by grade and by status, plus text search.
- A spoiler shield, on by default, that seals hidden trophies everywhere (list, detail panel and search) until they are earned or the shield is lifted.

## How to run

The app is plain static files under `app/` with no build step. Serve the folder with any static server, for example:

    node serve.ts

then open http://localhost:8080 in a desktop browser. It works fully offline after that first local load.

To hand the entry in the way the bounty expects:

    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

which copies `app/` and `screenshots/` to the output folder and writes `dossier.json` with the vendored make.fun library.

## Data and credit

Official trophy names, descriptions and grades follow the PlayStation list as published and as carried in the bounty kit starter (sourced from Exophase and PSNProfiles listings); each trophy's guide cites its sources in the app. Found this through make.fun? The referral link is https://make.fun/r/vwpycztt.

## License

MIT. See LICENSE.
