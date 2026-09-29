// ─────────────────────────────────────────────────────────────────────────
//  07 · a child-process pool — SOLUTION                     ★★★ stretch
//  run: node 07-child-pool.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape that keeps this simple is a shared cursor plus
//  N identical runners. `next` is the index of the work nobody has taken
//  yet; each runner grabs one with `next++`, awaits it, writes the answer
//  into results[mine], and loops. Because `next++` is synchronous and
//  JavaScript never interrupts a running function, no two runners can
//  claim the same index — no lock needed.
//  Writing into a pre-shaped array is what preserves input order even
//  though the children finish in whatever order they like.
//  `Math.min(limit, sources.length)` stops you creating five runners for
//  two jobs, and an empty list produces zero runners, so nothing spawns.
//  Wrong turn: chunking — `for (const batch of chunksOf(sources, 2))
//  await Promise.all(batch.map(runOne))`. That runs 2 at a time only in
//  the best case: every batch waits for its slowest member, so one
//  20-second child leaves the other slot idle for 20 seconds.

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
  const results = new Array(sources.length);
  let next = 0;

  const runner = async () => {
    while (next < sources.length) {
      const mine = next;
      next += 1;
      results[mine] = await runOne(sources[mine]);
    }
  };

  const size = Math.min(limit, sources.length);
  await Promise.all(Array.from({ length: size }, runner));
  return results;
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
