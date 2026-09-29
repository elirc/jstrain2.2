// ─────────────────────────────────────────────────────────────────────────
//  21 · withTimeout                                        ★★☆ core
//  concepts: Promise.race · timers · cleanup
//  run: node 21-with-timeout.js
// ─────────────────────────────────────────────────────────────────────────
//
//  No network call should be allowed to hang forever. Race the work
//  against a timer.
//
//      await withTimeout(after(5, 'v'), 50)   → 'v'
//      await withTimeout(after(80, 'v'), 20)  → rejects with
//                                               Error('timed out after 20ms')
//      await withTimeout(failIn(5, 'boom'), 50) → rejects with 'boom'
//
//  Whoever settles first wins. Two details the tests care about: the
//  timeout message is exactly `timed out after ${ms}ms`, and you must
//  clearTimeout when the work wins — otherwise a 30s timeout keeps your
//  process alive for 30s after the answer arrived.
//
//  hint: Promise.race with a second promise that only ever rejects

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

export const after = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const failIn = (ms, message) => {
  const p = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  p.catch(() => {}); // keeps an unfinished exercise from crashing Node
  return p;
};

export function withTimeout(promise, ms) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the value when the work is fast enough', async () => {
  eq(await withTimeout(after(5, 'v'), 60), 'v');
});

test('rejects when the work is too slow', async () => {
  await rejects(withTimeout(after(80, 'v'), 20), 'timed out');
});

test('the timeout error names the limit', async () => {
  await rejects(withTimeout(after(80, 'v'), 20), 'timed out after 20ms');
});

test('a rejection from the work wins if it lands first', async () => {
  await rejects(withTimeout(failIn(5, 'boom'), 60), 'boom');
});

test('does not wait for the full limit once the work is done', async () => {
  const t0 = Date.now();
  eq(await withTimeout(after(5, 'quick'), 3000), 'quick');
  ok(Date.now() - t0 < 500, 'the race must settle as soon as work does');
});

test('a late failure after the timeout changes nothing', async () => {
  await rejects(withTimeout(failIn(40, 'late'), 10), 'timed out');
  await sleep(50);
  ok(true, 'the late rejection must not blow up the process');
});
