// ─────────────────────────────────────────────────────────────────────────
//  43 · mapWithProgress (a progress bar you can trust)     ★☆☆ warm-up
//  concepts: Promise.all · callbacks · counters
//  run: node 43-map-progress.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A CLI uploading 40 files needs to say "12 / 40" while it works.
//  Build `mapWithProgress(items, fn, onProgress)`:
//
//      await mapWithProgress(['a', 'b'], upload, log)
//      → log(1, 2) then log(2, 2), and the array ['A', 'B']
//
//  Rules:
//    · `fn(item, index)` runs for every item, all in flight together
//    · the results come back in INPUT order, not completion order
//    · `onProgress(done, total)` fires once per completed item, with
//      `done` counting 1, 2, 3 ... total
//    · `onProgress` is optional; an empty list never calls it

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

// Uppercases after `ms`, so tests can make the FIRST item the slowest.
export const upload = (item, ms) => sleep(ms).then(() => item.toUpperCase());

export function mapWithProgress(items, fn, onProgress) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns results in input order, not completion order', async () => {
  const slowFirst = [20, 10, 12];
  const out = await mapWithProgress(['a', 'b', 'c'], (item, i) =>
    upload(item, slowFirst[i])
  );
  eq(out, ['A', 'B', 'C']);
});

test('reports progress once per item', async () => {
  const log = spy();
  await mapWithProgress(['a', 'b', 'c'], (item) => upload(item, 10), log);
  eq(log.callCount, 3);
});

test('counts 1..n against the total', async () => {
  const log = spy();
  const slowFirst = [20, 10, 12];
  await mapWithProgress(
    ['a', 'b', 'c'],
    (item, i) => upload(item, slowFirst[i]),
    log
  );
  eq(log.calls, [
    [1, 3],
    [2, 3],
    [3, 3],
  ]);
});

test('hands fn the index alongside the item', async () => {
  const seen = [];
  await mapWithProgress(['a', 'b'], async (item, index) => {
    seen.push([item, index]);
    return item;
  });
  eq(seen, [
    ['a', 0],
    ['b', 1],
  ]);
});

test('an empty list resolves [] and never reports progress', async () => {
  const log = spy();
  eq(await mapWithProgress([], (item) => upload(item, 10), log), []);
  eq(log.callCount, 0);
});

test('works with no onProgress at all', async () => {
  const out = await mapWithProgress(['a'], (item) => upload(item, 10));
  eq(out, ['A']);
});

test('runs the items concurrently', async () => {
  const t0 = Date.now();
  await mapWithProgress(['a', 'b', 'c'], (item) => upload(item, 20));
  ok(Date.now() - t0 < 55, 'three 20ms uploads must overlap');
});
