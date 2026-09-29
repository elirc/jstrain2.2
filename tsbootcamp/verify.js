// verify.js — CI for the TS track. Run: node tsbootcamp/verify.js [NN]
//
// Per module:
//   solutions/*.ts  → tsc must be CLEAN (0 errors) and tests all green
//   exercises/*.ts  → tsc may have type errors (that's the todo state) but
//                     no TS1xxx syntax errors; tests must have 0 failed
// Exit 1 if anything is broken.

import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { trackRoot, tscJs, tscFlags, nodeTsFlags, parseTscOutput } from './_lib/tsc-config.js';

const execFileP = promisify(execFile);
const only = process.argv[2];

const modules = readdirSync(trackRoot)
  .filter((d) => /^\d\d-/.test(d))
  .filter((d) => !only || d.startsWith(only))
  .sort();

let broken = 0;
let testCount = 0;
let fileCount = 0;
const started = Date.now();

function tscBatch(files) {
  return new Promise((resolveP) => {
    execFile(
      process.execPath,
      [tscJs, ...tscFlags, ...files],
      { cwd: trackRoot, maxBuffer: 32 * 1024 * 1024 },
      (_error, stdout) => resolveP(parseTscOutput(stdout || ''))
    );
  });
}

function runOne(path) {
  return new Promise((resolveP) => {
    execFile(
      process.execPath,
      [...nodeTsFlags, path],
      { timeout: 30000, env: { ...process.env, NO_COLOR: '1' } },
      (_error, stdout, stderr) => {
        const m = stdout.match(/#done passed=(\d+) failed=(\d+) todo=(\d+)/);
        resolveP(
          m
            ? { passed: +m[1], failed: +m[2], todo: +m[3] }
            : { crashed: (stderr || stdout).slice(-500) }
        );
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

for (const mod of modules) {
  console.log(`\n${mod}`);
  for (const kind of ['solutions', 'exercises']) {
    const dir = join(trackRoot, mod, kind);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts')).sort();
    if (!files.length) continue;
    const paths = files.map((f) => join(dir, f));

    const errors = await tscBatch(paths);
    const errByFile = new Map();
    for (const e of errors) {
      const key = e.file.split('/').pop();
      if (!errByFile.has(key)) errByFile.set(key, []);
      errByFile.get(key).push(e);
    }

    const runs = await pool(paths, runOne, 4);

    files.forEach((f, i) => {
      fileCount += 1;
      const tErrs = errByFile.get(f) || [];
      const syntax = tErrs.filter((e) => /^TS1\d{3}$/.test(e.code));
      const r = runs[i];
      const problems = [];
      if (kind === 'solutions' && tErrs.length) problems.push(`${tErrs.length} type error(s)`);
      if (kind === 'exercises' && syntax.length) problems.push(`${syntax.length} SYNTAX error(s)`);
      const debugExercise = kind === 'exercises' && /-debug/.test(mod);
      if (r.crashed !== undefined) problems.push('crashed');
      else {
        testCount += r.passed + r.failed + r.todo;
        if (r.passed + r.failed + r.todo === 0) problems.push('no tests ran');
        if (r.failed > 0 && !debugExercise) problems.push(`${r.failed} failing test(s)`);
        if (debugExercise && r.failed === 0 && r.todo === 0)
          problems.push('debug exercise already passes (no bug to find)');
        if (kind === 'solutions' && r.todo > 0) problems.push(`${r.todo} TODO left`);
      }
      if (problems.length) {
        broken += 1;
        console.log(`  ✘ ${kind}/${f}  BROKEN — ${problems.join(', ')}`);
        for (const e of tErrs.slice(0, 5)) console.log(`      ${e.raw}`);
        if (r.crashed) console.log(r.crashed.split('\n').map((l) => `      ${l}`).join('\n'));
      } else {
        const typeNote =
          kind === 'exercises' && tErrs.length ? ` (${tErrs.length} type todos)` : '';
        console.log(`  ✔ ${kind}/${f}  ok${typeNote}`);
      }
    });
  }
}

console.log(
  `\n${fileCount} files · ${testCount} test runs · ${broken} broken · ${((Date.now() - started) / 1000).toFixed(1)}s`
);
if (broken) process.exitCode = 1;
