// ─────────────────────────────────────────────────────────────────────────
//  07 · a child-process pool                                ★★★ stretch
//  concepts: concurrency limit · worker pool · back-pressure
//  run: node 07-child-pool.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Processes are not free. `sources.map(runOne)` on a 200-file job forks
//  200 Nodes at once, each with its own ~40 MB heap, and the machine
//  spends its afternoon swapping. Run them N at a time instead.
//
//      await runAll(['a', 'b', 'c'], 2)
//        → ['a-out', 'b-out', 'c-out']    results in INPUT order
//        → never more than 2 children alive at the same moment
//
//  `runOne(source)` is provided and books the concurrency numbers the
//  tests read: stats.started, stats.running, stats.peak.
//
//      runAll([], 2)   → []   and nothing is started
//
//  hint: start `limit` workers, and have each one loop — pull the next
//  index, run it, write the result into the slot it came from, repeat.
//  Do not build a chain of promises per item; build a pool of runners.

import { test, eq, ok } from '../../_lib/check.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Provided: bookkeeping the tests read.
export const stats = { started: 0, running: 0, peak: 0 };

export function resetStats() {
  stats.started = 0;
  stats.running = 0;
  stats.peak = 0;
}

// Provided: run one tiny child and resolve with its stdout.
export function runOne(source) {
  stats.started += 1;
  stats.running += 1;
  if (stats.running > stats.peak) stats.peak = stats.running;
  return execFileAsync(process.execPath, ['-e', source])
    .then(({ stdout }) => stdout)
    .finally(() => {
      stats.running -= 1;
    });
}

// Provided: a source that prints the label you give it.
export const prints = (label) => `process.stdout.write('${label}')`;

export async function runAll(sources, limit) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns one result per source, in input order', async () => {
  resetStats();
  const sources = ['a', 'b', 'c'].map(prints);
  eq(await runAll(sources, 2), ['a', 'b', 'c']);
  eq(stats.started, 3);
});

test('never runs more children than the limit allows', async () => {
  resetStats();
  const sources = ['x', 'y', 'z'].map(prints);
  await runAll(sources, 2);
  eq(stats.peak, 2);
});

test('a limit of 1 runs them strictly one at a time', async () => {
  resetStats();
  eq(await runAll(['one', 'two'].map(prints), 1), ['one', 'two']);
  eq(stats.peak, 1);
});

test('an empty list resolves to an empty array and starts nothing', async () => {
  resetStats();
  eq(await runAll([], 2), []);
  eq(stats.started, 0);
});

test('a limit larger than the list is not a problem', async () => {
  resetStats();
  eq(await runAll(['p', 'q'].map(prints), 5), ['p', 'q']);
  eq(stats.started, 2);
  ok(stats.peak <= 2, 'cannot run more children than there are sources');
});
