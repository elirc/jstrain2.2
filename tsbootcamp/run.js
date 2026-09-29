// run.js — grade one TS exercise: type-check it, then run its tests.
//
//   from a module dir:   node ../run.js exercises/03-narrowing.ts
//   from the track root: node run.js 02-narrowing/exercises/03-guards.ts
//   tests only (fast):   node ../run.js --tests exercises/03-narrowing.ts
//
// Types come first: tsc runs with the same strict flags as tsconfig.json.
// Then the file executes (Node strips/transforms types natively).
//
// tsc is slow on this machine (~30s cold). For a tight inner loop keep
// `npm run ts:watch` running in a second terminal (or rely on editor
// squiggles) and use --tests here; the full run is the final referee.

import { spawnSync } from 'node:child_process';
import { resolve, relative } from 'node:path';
import { existsSync } from 'node:fs';
import { trackRoot, tscJs, tscFlags, nodeTsFlags, parseTscOutput } from './_lib/tsc-config.js';

const args = process.argv.slice(2);
const testsOnly = args.includes('--tests');
const arg = args.find((a) => !a.startsWith('--'));
if (!arg) {
  console.error('usage: node run.js [--tests] <path-to-exercise.ts>');
  process.exit(2);
}
const file = resolve(process.cwd(), arg);
if (!existsSync(file)) {
  console.error(`not found: ${file}`);
  process.exit(2);
}

const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);
const rel = relative(trackRoot, file).replaceAll('\\', '/');

// 1 · types
let errors = [];
if (testsOnly) {
  console.log(`  ${c('2', 'types skipped (--tests) — run without the flag before moving on')}`);
} else {
  const tsc = spawnSync(
    process.execPath,
    [tscJs, ...tscFlags, file],
    { cwd: trackRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  );
  errors = parseTscOutput(tsc.stdout || '');

  if (errors.length === 0) {
    console.log(`  ${c('32', '✔')} types clean ${c('2', `(${rel})`)}`);
  } else {
    console.log(`  ${c('31', '✘')} ${errors.length} type error(s) ${c('2', `(${rel})`)}`);
    for (const e of errors) {
      console.log(`      ${c('2', `L${e.line}`)} ${c('31', e.code)} ${e.message}`);
    }
    if (rel.includes('exercises/')) {
      console.log(
        `  ${c('33', 'type errors are your todo list — make tsc quiet, then go for green tests')}`
      );
    }
    if (errors.some((e) => e.code === 'TS2344')) {
      console.log(
        `  ${c('2', "TS2344 'false'…'true' = a failed Expect<Equal<…>> — your type isn't an exact match (check readonly/optional/literal)")}`
      );
    }
    if (errors.some((e) => e.code === 'TS2578')) {
      console.log(
        `  ${c('2', 'TS2578 unused @ts-expect-error = your types are too loose — an illegal call now compiles; tighten them')}`
      );
    }
  }
}

// 2 · runtime tests
console.log('');
const run = spawnSync(process.execPath, [...nodeTsFlags, file], {
  stdio: 'inherit',
});

process.exitCode = errors.length > 0 || run.status !== 0 ? 1 : 0;
