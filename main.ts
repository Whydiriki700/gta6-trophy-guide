// Leonida Ledger — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is the app/ folder beside this file: plain static files that a browser
// opens at app/index.html and runs with the network off. This program hands the entry in:
// it copies app/ and screenshots/ into the output directory and writes dossier.json there
// with buildDossier from vendor/makefun-frontend.ts. The vendored library stays untouched,
// because the scorer rebuilds the dossier with its own copy and compares the bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own (reference/gate.json): the dossier text cap, at most
// 4 screenshots of at most 256 KiB each, and app/ within 993 entries and 48 MiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const shotCount = existsSync(join(outDir, 'screenshots')) ? readdirSync(join(outDir, 'screenshots')).length : 0;
console.log(`Leonida Ledger handed in: app/ copied, ${shotCount} screenshot(s), dossier.json ${dossier.length} bytes.`);
