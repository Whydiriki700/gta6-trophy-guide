// Leonida Trophy Atlas — entry program for gta6-trophy-guide-01.
// Node 22, standard library only.
//
// What sits beside this file: app/, plain static files that a browser opens at
// app/index.html and runs with the network off, and screenshots/, 3 or 4 PNG
// renders of that app. This program hands the entry in by copying both folders
// into the output directory and writing dossier.json there, built with the
// vendored make.fun library (vendor/makefun-frontend.ts), which must stay
// byte-identical to the kit's copy: the scorer rebuilds the dossier with its
// own copy and compares the bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }

  // Caps from the scorer's own reference: the dossier text cap, at most 4
  // screenshots of at most 256 KiB each, and app/ within 993 entries and 48 MiB.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);

  const shots = existsSync(join(outputDir, 'screenshots'))
    ? readdirSync(join(outputDir, 'screenshots')).length
    : 0;
  console.log(`Leonida Trophy Atlas handed in: app/ copied, ${shots} screenshot(s), dossier.json ${dossier.length} bytes.`);
}

handIn();
