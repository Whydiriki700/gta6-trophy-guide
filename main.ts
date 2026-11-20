// Leonida Trophy Atlas — handover program for the gta6-trophy-guide-01 bounty.
//
// The guide itself is the static site in app/ (index.html, style.css, app.js and
// data/trophies.json). This program is the courier: it copies app/ and
// screenshots/ into the output directory and writes dossier.json there with
// buildDossier from the vendored make.fun library, which is the summary the
// judge reads. vendor/makefun-frontend.ts stays exactly as the kit issued it,
// because the scorer rebuilds the dossier with its own copy and compares bytes.
//
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader.)

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The scorer's published caps for this bounty, checked here so a bad tree
// fails loudly at handover time instead of silently at grading time.
const DOSSIER_TEXT_CAP = 163_840;
const SHOT_LIMIT = 4;
const SHOT_BYTE_CAP = 262_144;
const APP_FILE_CAP = 993;
const APP_BYTE_CAP = 50_331_648;

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyInto(sourceName: string): void {
  const from = join(repoRoot, sourceName);
  if (!existsSync(from)) return;
  cpSync(from, join(outputDir, sourceName), { recursive: true });
}

function surveyTree(dir: string): { entries: number; bytes: number } {
  let entries = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    entries += 1;
    if (info.isDirectory()) {
      const inner = surveyTree(path);
      entries += inner.entries;
      bytes += inner.bytes;
    } else {
      bytes += info.size;
    }
  }
  return { entries, bytes };
}

function checkShots(dir: string): void {
  if (!existsSync(dir)) return;
  const shots = readdirSync(dir).filter((name) => !name.startsWith('.'));
  if (shots.length > SHOT_LIMIT) {
    throw new Error(`screenshots/: ${shots.length} files, over the limit of ${SHOT_LIMIT}`);
  }
  for (const name of shots) {
    const size = statSync(join(dir, name)).size;
    if (size > SHOT_BYTE_CAP) {
      throw new Error(`screenshots/${name}: ${size} bytes, over the ${SHOT_BYTE_CAP} byte cap`);
    }
  }
}

mkdirSync(outputDir, { recursive: true });
copyInto('app');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyInto('screenshots');

const appSurvey = surveyTree(join(outputDir, 'app'));
if (appSurvey.entries > APP_FILE_CAP) {
  throw new Error(`app/: ${appSurvey.entries} entries, over the limit of ${APP_FILE_CAP}`);
}
if (appSurvey.bytes > APP_BYTE_CAP) {
  throw new Error(`app/: ${appSurvey.bytes} bytes, over the cap of ${APP_BYTE_CAP}`);
}
checkShots(join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, {
  text_max_bytes: DOSSIER_TEXT_CAP,
  screenshots: { max: SHOT_LIMIT, max_bytes: SHOT_BYTE_CAP },
  app_max_files: APP_FILE_CAP,
  app_max_bytes: APP_BYTE_CAP,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`atlas handed in: ${appSurvey.entries} app entries, ${appSurvey.bytes} app bytes, dossier ${dossier.length} bytes`);
