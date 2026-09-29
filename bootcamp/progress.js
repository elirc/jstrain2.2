// progress.js — your scoreboard. Run: node bootcamp/progress.js [NN]
//
// Runs every exercise file (or just module NN) and shows how far you are:
//   ✔ done (all tests pass)   ◐ started (some pass)   ☐ untouched   ✘ failing
//
// In *-debug* modules the tests ship red on purpose, so a failing file is
// 🐛 (bug still there), not ✘ — same "not done yet", none of the guilt.

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const only = process.argv[2];
const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);

const modules = readdirSync(root)
  .filter((d) => /^\d\d-/.test(d))
  .filter((d) => !only || d.startsWith(only))
  .sort();

function runOne(path) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path],
      { timeout: 30000, env: { ...process.env, NO_COLOR: '1' } },
      (error, stdout) => {
        const m = stdout.match(/#done passed=(\d+) failed=(\d+) todo=(\d+)/);
        resolve(m ? { passed: +m[1], failed: +m[2], todo: +m[3] } : null);
      }
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

let doneFiles = 0;
let totalFiles = 0;

for (const mod of modules) {
  const dir = join(root, mod, 'exercises');
  const isDebug = /-debug|-hunts?$/.test(mod);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
  if (!files.length) {
    // module 13 is HTML — graded live in the browser, not from here
    const html = readdirSync(dir).filter((f) => f.endsWith('.html')).length;
    if (html) {
      console.log(`\n${c('1', mod)}  ${c('2', `${html} HTML exercises — open them in a browser; the page grades you`)}`);
    }
    continue;
  }
  const results = await pool(files.map((f) => join(dir, f)), runOne, 6);
  const lines = files.map((f, i) => {
    const r = results[i];
    totalFiles += 1;
    if (!r) return `  ${c('31', '✘')} ${f}  ${c('31', 'crashed')}`;
    if (r.failed > 0 && isDebug) return `  ${c('33', '🐛')} ${f}  ${c('33', '(bug not fixed yet)')}`;
    if (r.failed > 0) return `  ${c('31', '✘')} ${f}  ${c('31', `${r.failed} failing`)}`;
    if (r.todo === 0) { doneFiles += 1; return `  ${c('32', '✔')} ${c('2', f)}`; }
    if (r.passed > 0) return `  ${c('33', '◐')} ${f}  ${c('33', `${r.passed} of ${r.passed + r.todo}`)}`;
    return `  ${c('2', '☐ ' + f)}`;
  });
  const done = lines.filter((l) => l.includes('✔')).length;
  console.log(`\n${c('1', mod)}  ${done}/${files.length}`);
  console.log(lines.join('\n'));
}

const pct = totalFiles ? Math.round((doneFiles / totalFiles) * 100) : 0;
const bar = '█'.repeat(Math.round(pct / 4)).padEnd(25, '░');
console.log(`\n  ${bar}  ${doneFiles}/${totalFiles} exercises (${pct}%)`);
