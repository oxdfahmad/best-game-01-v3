// ORRERY — Light the Nine Dials: the entry program (Node 22, stdlib only).
// It hands the game in: copies this repository's game/ and screenshots/
// beside this file into /output (or MAKEFUN_OUTPUT_DIR outside the grader)
// and writes /output/dossier.json with the vendored make.fun library, so the
// judge can read the screenshots and the source outline of the entry.
//
// Serve the game locally first with any static server, e.g.:
//   python3 -m http.server 8080 --directory game
// then open http://localhost:8080 and play it. To build the hand-in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const handInDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

function orreryFail(message) {
  throw new Error(`ORRERY hand-in refused: ${message}`);
}

if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) orreryFail('game/ is missing');
if (!existsSync(join(gameDir, 'index.html'))) orreryFail('game/index.html is missing');
if (!existsSync(shotsDir)) orreryFail('screenshots/ is missing');

mkdirSync(handInDir, { recursive: true });
cpSync(gameDir, join(handInDir, 'game'), { recursive: true });
mkdirSync(join(handInDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(handInDir, 'screenshots'), { recursive: true });

// The scorer's own caps (kit reference/gate.json): only text_max_bytes shapes
// the bytes; the rest refuse an entry the scorer would refuse, so the hand-in
// refuses early with a plain message instead of a silent invalid entry.
const dossier = buildDossier(handInDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(handInDir, 'dossier.json'), dossier);
