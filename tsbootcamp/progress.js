// progress.js — TS-track scoreboard. Run: node tsbootcamp/progress.js [NN]
//
// An exercise is DONE when its types are clean AND its tests all pass.
//   ✔ done   ◔ types clean, tests pending   ◐ started   ☐ untouched   ✘ failing
//
// In *-debug* modules the tests ship red on purpose (the code compiles, the
// behaviour is wrong), so a failing file is 🐛 — still not done, no guilt.

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { trackRoot, tscJs, tscFlags, nodeTsFlags, parseTscOutput } from './_lib/tsc-config.js';

const only = process.argv[2];
const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);

const modules = readdirSync(trackRoot)
  .filter((d) => /^\d\d-/.test(d))
  .filter((d) => !only || d.startsWith(only))
  .sort();

function tscBatch(files) {
  return new Promise((resolveP) => {
    execFile(
      process.execPath,
      [tscJs, ...tscFlags, ...files],
      { cwd: trackRoot, maxBuffer: 32 * 1024 * 1024 },
      (_e, stdout) => resolveP(parseTscOutput(stdout || ''))
    );
  });
}

function runOne(path) {
  return new Promise((resolveP) => {
    execFile(
      process.execPath,
      [...nodeTsFlags, path],
      { timeout: 30000, env: { ...process.env, NO_COLOR: '1' } },
      (_e, stdout) => {
        const m = stdout.match(/#done passed=(\d+) failed=(\d+) todo=(\d+)/);
        resolveP(m ? { passed: +m[1], failed: +m[2], todo: +m[3] } : null);
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
  const dir = join(trackRoot, mod, 'exercises');
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts')).sort();
  if (!files.length) continue;
  const paths = files.map((f) => join(dir, f));
  const isDebug = /-debug/.test(mod);

  const errors = await tscBatch(paths);
  const errCount = new Map();
  for (const e of errors) {
    const key = e.file.split('/').pop();
    errCount.set(key, (errCount.get(key) || 0) + 1);
  }
  const runs = await pool(paths, runOne, 4);

  let done = 0;
  const lines = files.map((f, i) => {
    totalFiles += 1;
    const typeErrs = errCount.get(f) || 0;
    const r = runs[i];
    if (!r) return `  ${c('31', '✘')} ${f}  ${c('31', 'crashed')}`;
    if (r.failed > 0 && isDebug)
      return `  ${c('33', '🐛')} ${f}  ${c('33', '(bug not fixed yet)')}`;
    if (r.failed > 0) return `  ${c('31', '✘')} ${f}  ${c('31', `${r.failed} failing`)}`;
    if (typeErrs === 0 && r.todo === 0) {
      done += 1; doneFiles += 1;
      return `  ${c('32', '✔')} ${c('2', f)}`;
    }
    if (typeErrs === 0) return `  ${c('36', '◔')} ${f}  ${c('36', `types clean · ${r.todo} todo`)}`;
    if (r.passed > 0)
      return `  ${c('33', '◐')} ${f}  ${c('33', `${typeErrs} type err · ${r.passed} passing`)}`;
    return `  ${c('2', `☐ ${f}  (${typeErrs} type todos)`)}`;
  });
  console.log(`\n${c('1', mod)}  ${done}/${files.length}`);
  console.log(lines.join('\n'));
}

const pct = totalFiles ? Math.round((doneFiles / totalFiles) * 100) : 0;
const bar = '█'.repeat(Math.round(pct / 4)).padEnd(25, '░');
console.log(`\n  ${bar}  ${doneFiles}/${totalFiles} exercises (${pct}%)`);
