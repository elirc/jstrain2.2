// ─────────────────────────────────────────────────────────────────────────
//  21 · withTimeout — SOLUTION                             ★★☆ core
//  run: node 21-with-timeout.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: build a timer promise that rejects after ms, race it
//  against the work, and clean the timer up in .finally so the cleanup
//  runs on both paths.
//  Note what a timeout does NOT do: it does not cancel the work. The
//  original promise keeps running and eventually settles into the void —
//  its result is ignored because the race already settled. Real
//  cancellation needs AbortController (exercise 27).
//  Keeping a reference to the timer id matters more than it looks: an
//  uncleared 30s timer keeps the Node event loop alive, so a CLI that
//  answered in 20ms still takes 30s to exit.
//  Wrong turn: `setTimeout(reject, ms)` — reject then receives the
//  timer's arguments instead of an Error.

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
  let timer;
  const limit = new Promise((_, reject) => {
    const fail = () => reject(new Error(`timed out after ${ms}ms`));
    timer = setTimeout(fail, ms);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
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
