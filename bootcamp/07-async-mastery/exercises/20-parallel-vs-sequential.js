// ─────────────────────────────────────────────────────────────────────────
//  20 · loadSequential · loadParallel                      ★★☆ core
//  concepts: await in a loop · Promise.all · concurrency
//  run: node 20-parallel-vs-sequential.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The most common performance bug in async JavaScript, and its fix.
//  Write BOTH versions of "load every id" over the same fetchOne:
//
//      await loadSequential(['a','b'])  → ['a:1', 'b:2']  one at a time
//      await loadParallel(['a','b'])    → ['a:1', 'b:2']  both at once
//
//  Same output, wildly different cost: with four ids at 10ms each,
//  sequential takes ~40ms and parallel ~10ms. The tracker below records
//  how many calls are in flight, and the tests check that sequential
//  never overlaps while parallel starts everything before anything ends.
//
//  hint: one uses a for-of loop; the other starts every call, then awaits

import { test, eq, ok } from '../../_lib/check.js';

export const tracker = { inFlight: 0, maxInFlight: 0, events: [] };

export const resetTracker = () => {
  tracker.inFlight = 0;
  tracker.maxInFlight = 0;
  tracker.events = [];
};

const VALUES = { a: 1, b: 2, c: 3, d: 4 };

export function fetchOne(id) {
  tracker.inFlight += 1;
  tracker.maxInFlight = Math.max(tracker.maxInFlight, tracker.inFlight);
  tracker.events.push(`start:${id}`);
  return new Promise((resolve) =>
    setTimeout(() => {
      tracker.inFlight -= 1;
      tracker.events.push(`end:${id}`);
      resolve(`${id}:${VALUES[id]}`);
    }, 10)
  );
}

export function loadSequential(ids) {
  throw new Error('TODO');
}

export function loadParallel(ids) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sequential returns the values in order', async () => {
  resetTracker();
  eq(await loadSequential(['a', 'b']), ['a:1', 'b:2']);
});

test('sequential never has two calls in flight', async () => {
  resetTracker();
  await loadSequential(['a', 'b', 'c']);
  eq(tracker.maxInFlight, 1);
});

test('sequential finishes each call before starting the next', async () => {
  resetTracker();
  await loadSequential(['a', 'b']);
  eq(tracker.events, ['start:a', 'end:a', 'start:b', 'end:b']);
});

test('parallel returns the same values in input order', async () => {
  resetTracker();
  eq(await loadParallel(['a', 'b', 'c']), ['a:1', 'b:2', 'c:3']);
});

test('parallel starts everything before anything finishes', async () => {
  resetTracker();
  await loadParallel(['a', 'b', 'c', 'd']);
  const starts = ['start:a', 'start:b', 'start:c', 'start:d'];
  eq(tracker.events.slice(0, 4), starts);
  eq(tracker.maxInFlight, 4);
});

test('parallel beats sequential on the same work', async () => {
  resetTracker();
  const t0 = Date.now();
  await loadSequential(['a', 'b', 'c']);
  const slow = Date.now() - t0;
  const t1 = Date.now();
  await loadParallel(['a', 'b', 'c']);
  const fast = Date.now() - t1;
  ok(fast < slow, `parallel ${fast}ms should beat sequential ${slow}ms`);
});
