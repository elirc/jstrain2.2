// ─────────────────────────────────────────────────────────────────────────
//  13 · a batch of children, two at a time                      ★★☆ core
//  concepts: spawn · exit codes · concurrency limit · partial failure
//  run: node 13-child-batch-limit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You ran a child pool in module 17, where every child succeeded. Real
//  batches contain one that does not, and one bad exit code must not
//  take the other results down with it.
//
//  Build two things:
//
//  1. `runOne(source)` → { stdout, code }
//     Run `node -e <source>` with the provided `spawnCounted`, collect
//     everything the child prints on stdout, and resolve — never reject —
//     with its exit code:
//
//         runOne(prints('hi'))         → { stdout: 'hi', code: 0 }
//         runOne(failsWith('half', 3)) → { stdout: 'half', code: 3 }
//
//  2. `runBatch(sources, limit)` → the results, in input order, with at
//     most `limit` children alive at any moment.

import { test, eq, ok } from '../../_lib/check.js';
import { spawn } from 'node:child_process';

// Provided: the tests read this to check your limit.
export const stats = { started: 0, running: 0, peak: 0 };

export function resetStats() {
  stats.started = 0;
  stats.running = 0;
  stats.peak = 0;
}

// Provided: use THIS instead of spawn — same call, it just counts the
// children that are alive at once.
export function spawnCounted(command, args) {
  stats.started += 1;
  stats.running += 1;
  stats.peak = Math.max(stats.peak, stats.running);
  const child = spawn(command, args);
  child.once('close', () => {
    stats.running -= 1;
  });
  return child;
}

// Provided: three tiny programs to run.
export const prints = (label) => `process.stdout.write('${label}')`;
export const failsWith = (label, code) =>
  `process.stdout.write('${label}'); process.exit(${code})`;
export const warns = (label, text) =>
  `process.stderr.write('${text}'); process.stdout.write('${label}')`;

export async function runOne(source) {
  throw new Error('TODO');
}

export async function runBatch(sources, limit) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one child: what it printed and how it ended', async () => {
  resetStats();
  eq(await runOne(prints('hello')), { stdout: 'hello', code: 0 });
  eq(stats.started, 1);
});

test('a batch comes back in input order, two children at a time', async () => {
  resetStats();
  const sources = ['a', 'b', 'c'].map(prints);
  eq(await runBatch(sources, 2), [
    { stdout: 'a', code: 0 },
    { stdout: 'b', code: 0 },
    { stdout: 'c', code: 0 },
  ]);
  eq(stats.started, 3);
  eq(stats.peak, 2, 'two at a time, no more');
});

test('a bad exit code is a result, not a thrown batch', async () => {
  resetStats();
  const results = await runBatch(
    [prints('one'), failsWith('two', 3), prints('three')],
    2
  );
  eq(results, [
    { stdout: 'one', code: 0 },
    { stdout: 'two', code: 3 },
    { stdout: 'three', code: 0 },
  ]);
  ok(results[1].stdout === 'two', 'a failing child still had output to give');
});

test('a limit of one runs them strictly one after the other', async () => {
  resetStats();
  eq(await runBatch([prints('first'), prints('second')], 1), [
    { stdout: 'first', code: 0 },
    { stdout: 'second', code: 0 },
  ]);
  eq(stats.peak, 1);
});

test('an empty batch starts nothing; a big limit is harmless', async () => {
  resetStats();
  eq(await runBatch([], 2), []);
  eq(stats.started, 0);

  eq(await runBatch([prints('p')], 5), [{ stdout: 'p', code: 0 }]);
  ok(stats.peak <= 1, 'you cannot run more children than there are jobs');
});

test('stderr is not stdout — noise stays out of the result', async () => {
  resetStats();
  eq(await runOne(warns('clean', 'a deprecation warning')), {
    stdout: 'clean',
    code: 0,
  });
});
