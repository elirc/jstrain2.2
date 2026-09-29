// redo.js — spaced retrieval. Run: node bootcamp/redo.js [count] [NN]
//
// progress.js tracks what you have DONE; this tool works on what you have
// KEPT. It picks `count` random exercises that are currently ✔ (optionally
// only from module NN), restores their pristine TODO version from git into
// bootcamp/redo/, and you rebuild each one from memory:
//
//     node bootcamp/redo.js 5        # pick 5 solved files, any module
//     node bootcamp/redo.js 3 09     # 3 solved files from module 09
//     node bootcamp/redo/<file>      # then rebuild until all green
//
// Rebuilding something you HALF-forgot is what moves it to long-term
// memory — that's the whole tool. Files land in bootcamp/redo/ (gitignored,
// safe to delete). Your original solved files are never touched.
//
// Needs git (the pristine versions come from the last commit). Multi-file
// exercises and browser-graded HTML are skipped — they can't be rebuilt
// from a single restored file.

import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const repo = join(root, '..');
const count = Number(process.argv[2]) || 5;
const only = process.argv[3];
const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);

const modules = readdirSync(root)
  .filter((d) => /^\d\d-/.test(d))
  .filter((d) => !only || d.startsWith(only))
  .sort();

function run(cmd, args, opts) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 30000, ...opts }, (error, stdout) =>
      resolve({ error, stdout })
    );
  });
}

async function pool(items, worker, size) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) { const k = i++; out[k] = await worker(items[k]); }
    })
  );
  return out;
}

// 1 · find every currently-solved exercise (all tests pass, nothing todo)
const candidates = [];
for (const mod of modules) {
  const dir = join(root, mod, 'exercises');
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
    candidates.push({ mod, file: f, path: join(dir, f) });
  }
}

console.log(`checking ${candidates.length} exercises for solved ones…`);
const results = await pool(
  candidates,
  async (job) => {
    const { stdout } = await run(process.execPath, [job.path], {
      env: { ...process.env, NO_COLOR: '1' },
    });
    const m = (stdout || '').match(/#done passed=(\d+) failed=(\d+) todo=(\d+)/);
    return m && +m[2] === 0 && +m[3] === 0 && +m[1] > 0;
  },
  6
);
const solved = candidates.filter((_, i) => results[i]);

if (solved.length === 0) {
  console.log('nothing is solved yet — go earn some ✔ first, then come back.');
  process.exit(0);
}

// 2 · sample, restore pristine versions from git
const picked = [];
const bag = [...solved];
while (picked.length < count && bag.length) {
  const i = Math.floor(Math.random() * bag.length);
  picked.push(bag.splice(i, 1)[0]);
}

const outDir = join(root, 'redo');
mkdirSync(outDir, { recursive: true });
const written = [];
for (const job of picked) {
  const gitPath = `bootcamp/${job.mod}/exercises/${job.file}`;
  const { error, stdout } = await run(
    'git', ['show', `HEAD:${gitPath}`], { cwd: repo, maxBuffer: 4 * 1024 * 1024 }
  );
  if (error || !stdout) {
    console.log(`  ${c('33', 'skip')} ${gitPath} — not in the last commit`);
    continue;
  }
  if (stdout.includes("from './") || stdout.includes('from "./')) {
    console.log(`  ${c('33', 'skip')} ${gitPath} — multi-file exercise`);
    continue;
  }
  // the file moves one directory up, so its _lib import moves with it
  const source = stdout.replace(/\.\.\/\.\.\/_lib\//g, '../_lib/');
  const name = `${job.mod.slice(0, 2)}-${job.file}`;
  writeFileSync(join(outDir, name), source);
  written.push(name);
}

if (!written.length) {
  console.log('\nnothing restorable in this sample — run it again.');
  process.exit(0);
}

console.log(`\n${c('1', `${written.length} rebuild(s) ready in bootcamp/redo/`)}`);
for (const name of written) console.log(`  ☐ node bootcamp/redo/${name}`);
console.log(`\nRules: no peeking at your solved file until YOUR rebuild is
green. If the two differ afterwards, the difference is the lesson.
Delete the redo/ folder whenever — it is regenerated on demand.`);
