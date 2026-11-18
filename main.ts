import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Inputs are immutable assets, so repeated runs produce identical file bytes.
const source = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
if (output === resolve(source) || output.startsWith(resolve(source, 'game')) || output.startsWith(resolve(source, 'screenshots'))) {
  throw new Error('Choose an output directory outside the source asset folders.');
}
mkdirSync(output, { recursive: true });
for (const folder of ['game', 'screenshots']) {
  cpSync(join(source, folder), join(output, folder), { recursive: true, force: true });
}
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
