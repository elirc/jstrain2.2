// ─────────────────────────────────────────────────────────────────────────
//  13 · a batch of children, two at a time — SOLUTION            ★★☆ core
//  run: node 13-child-batch-limit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two ideas, and both are about not losing information.
//  First, a non-zero exit is an outcome, not an exception. `execFile`
//  rejects on it, and a rejection inside `Promise.all` cancels nothing but
//  discards every other answer — one failing job and you have no idea
//  what the other nineteen printed. Resolving `{ stdout, code }` keeps the
//  whole picture, and the caller decides what a 3 means. Notice the
//  failing child still produced output: throwing it away is throwing away
//  the evidence you would have debugged with.
//  Wait for 'close', not 'exit'. 'exit' fires when the process is gone,
//  which can be BEFORE its stdout pipe has been drained; 'close' fires
//  when the streams are done too. Resolve on 'exit' and you get truncated
//  output on the busy runs and full output on the quiet ones — a bug that
//  only shows up under load.
//  Second, the limit. A shared cursor plus N identical runners: `next++`
//  is synchronous, so no two runners can claim the same index and no lock
//  is needed. Writing into a pre-shaped array is what preserves input
//  order while the children finish in whatever order they like.
//  Wrong turn: chunking — `for (const pair of chunksOf(sources, 2))
//  await Promise.all(pair.map(runOne))`. That is two-at-a-time only in the
//  best case: every chunk waits for its slowest member, so one 20-second
//  child leaves the other slot idle for 20 seconds.
//  And `Math.min(limit, sources.length)` stops you creating five runners
//  for two jobs — with an empty list, no runner and no child at all.

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

export function runOne(source) {
  return new Promise((resolve, reject) => {
    const child = spawnCounted(process.execPath, ['-e', source]);
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.once('error', reject); // could not spawn at all — that IS an error
    child.once('close', (code) => resolve({ stdout, code })); // not 'exit'
  });
}

export async function runBatch(sources, limit) {
  const results = new Array(sources.length);
  let next = 0;

  const runner = async () => {
    while (next < sources.length) {
      const mine = next;
      next += 1; // synchronous claim: no two runners take the same job
      results[mine] = await runOne(sources[mine]);
    }
  };

  const size = Math.min(limit, sources.length);
  await Promise.all(Array.from({ length: size }, runner));
  return results;
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
