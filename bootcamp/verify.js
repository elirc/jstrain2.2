// verify.js — CI for the bootcamp itself. Run: node bootcamp/verify.js [NN]
//
// Checks every module (or just module NN):
//   - each solutions/*.js runs green: 0 failed, 0 todo
//   - each exercises/*.js runs clean: 0 failed (todo is the expected state)
// Exit code 1 if anything is broken.

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const only = process.argv[2];

const modules = readdirSync(root)
  .filter((d) => /^\d\d-/.test(d))
  .filter((d) => !only || d.startsWith(only))
  .sort();

const jobs = [];
for (const mod of modules) {
  for (const kind of ['solutions', 'exercises']) {
    const dir = join(root, mod, kind);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
      jobs.push({ mod, kind, file: f, path: join(dir, f) });
    }
  }
}

function runOne(job) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [job.path],
      { timeout: 30000, env: { ...process.env, NO_COLOR: '1' } },
      (error, stdout, stderr) => {
        const m = stdout.match(/#done passed=(\d+) failed=(\d+) todo=(\d+)/);
        if (!m) {
          resolve({ ...job, broken: 'crashed (no result line)', detail: (stderr || stdout).slice(-600) });
          return;
        }
        const [passed, failed, todo] = [+m[1], +m[2], +m[3]];
        // In hunt modules (dir contains -debug, or ends in -hunts) the
        // exercises SHIP with failing tests — the student's job is to fix
        // the bug. Only solutions must pass.
        const debugExercise =
          job.kind === 'exercises' && /-debug|-hunts?$/.test(job.mod);
        let broken = null;
        if (passed + failed + todo === 0) broken = 'no tests ran';
        else if (failed > 0 && !debugExercise) broken = `${failed} failing test(s)`;
        else if (debugExercise && failed === 0 && todo === 0)
          broken = 'debug exercise already passes (no bug to find)';
        else if (job.kind === 'solutions' && todo > 0) broken = `${todo} TODO left in solution`;
        resolve({ ...job, passed, failed, todo, broken, detail: broken ? stdout.slice(-600) : '' });
      }
    );
  });
}

async function pool(items, worker, size) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) results.push(await worker(items[i++]));
    })
  );
  return results;
}

const started = Date.now();
const results = await pool(jobs, runOne, 6);
const bad = results.filter((r) => r.broken);
const tests = results.reduce((n, r) => n + (r.passed || 0) + (r.todo || 0), 0);

let lastMod = '';
for (const r of results.sort((a, b) => (a.path < b.path ? -1 : 1))) {
  if (r.mod !== lastMod) {
    lastMod = r.mod;
    console.log(`\n${r.mod}`);
  }
  const tag = r.broken ? `BROKEN — ${r.broken}` : 'ok';
  console.log(`  ${r.broken ? '✘' : '✔'} ${r.kind}/${r.file}  ${tag}`);
  if (r.broken && r.detail) {
    console.log(r.detail.split('\n').map((l) => `      ${l}`).join('\n'));
  }
}

console.log(
  `\n${results.length} files · ${tests} tests · ${bad.length} broken · ${((Date.now() - started) / 1000).toFixed(1)}s`
);
if (bad.length) process.exitCode = 1;
