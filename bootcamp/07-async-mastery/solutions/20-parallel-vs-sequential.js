// ─────────────────────────────────────────────────────────────────────────
//  20 · loadSequential · loadParallel — SOLUTION           ★★☆ core
//  run: node 20-parallel-vs-sequential.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `await` inside a for-loop means "finish this one, then
//  start the next" — the trips are stacked end to end. That is correct
//  when each step needs the previous result, and pure waste when they
//  are independent.
//  The parallel version separates STARTING from WAITING: `ids.map(fetchOne)`
//  fires every request immediately and gives you an array of pending
//  promises; Promise.all then waits for all of them and hands back the
//  values in input order.
//  Wrong turn: `ids.map(async (id) => await fetchOne(id))` without
//  Promise.all — you get an array of promises, and the caller sees
//  [Promise, Promise]. The other classic is `await` inside .forEach,
//  which does not wait at all: forEach ignores the returned promises.

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

export async function loadSequential(ids) {
  const out = [];
  for (const id of ids) {
    out.push(await fetchOne(id));
  }
  return out;
}

export async function loadParallel(ids) {
  return Promise.all(ids.map((id) => fetchOne(id)));
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
