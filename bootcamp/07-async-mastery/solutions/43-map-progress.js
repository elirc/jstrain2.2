// ─────────────────────────────────────────────────────────────────────────
//  43 · mapWithProgress (progress bar) — SOLUTION          ★☆☆ warm-up
//  run: node 43-map-progress.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `items.map(async ...)` starts every item immediately and
//  hands `Promise.all` an array of promises in INPUT order — that is where
//  the ordering guarantee comes from, and why the result array is ordered
//  even though the work finishes in whatever order it likes.
//  The progress counter lives outside the map and is bumped after each
//  `await`. Because JavaScript is single-threaded, `done += 1` needs no
//  lock: no two completions can interleave mid-statement.
//  `onProgress?.(done, items.length)` keeps the callback optional without
//  an if-statement, and passing the total every time means the consumer
//  never has to remember it.
//  Wrong turn: calling onProgress with the INDEX instead of the count.
//  Index 2 finishing first would print "3 / 3" while two uploads are still
//  running — a progress bar that jumps backwards.

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

// Uppercases after `ms`, so tests can make the FIRST item the slowest.
export const upload = (item, ms) => sleep(ms).then(() => item.toUpperCase());

export function mapWithProgress(items, fn, onProgress) {
  let done = 0;
  return Promise.all(
    items.map(async (item, index) => {
      const value = await fn(item, index);
      done += 1;
      onProgress?.(done, items.length);
      return value;
    })
  );
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
