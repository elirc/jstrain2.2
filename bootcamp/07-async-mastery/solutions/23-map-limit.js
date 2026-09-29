// ─────────────────────────────────────────────────────────────────────────
//  23 · mapLimit (concurrency limiter) — SOLUTION          ★★★ stretch
//  run: node 23-map-limit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the trick is not to think in batches (start 2, wait for
//  both, start 2 more) — that idles a worker whenever one item is slow.
//  Think in WORKERS: spawn `limit` async loops that share one cursor,
//  each grabbing the next index and writing its result to out[i] until
//  the list runs dry. Promise.all over the workers waits for the pool.
//  Because each worker awaits before taking the next index, the number
//  running is exactly the number of workers — the limit is structural,
//  not something you check with an if.
//  Wrong turn: `Math.min` forgotten, so an empty list spawns workers
//  that never resolve; or pushing results, which returns them in
//  completion order.

import { test, eq, ok, rejects } from '../../_lib/check.js';

export const tracker = { inFlight: 0, maxInFlight: 0 };

export const resetTracker = () => {
  tracker.inFlight = 0;
  tracker.maxInFlight = 0;
};

// Takes 10ms, and records how many calls overlap.
export function fetchOne(id, index) {
  tracker.inFlight += 1;
  tracker.maxInFlight = Math.max(tracker.maxInFlight, tracker.inFlight);
  return new Promise((resolve) =>
    setTimeout(() => {
      tracker.inFlight -= 1;
      resolve(`${id}${index}`);
    }, 10)
  );
}

export async function mapLimit(items, limit, fn) {
  const list = [...items];
  const out = new Array(list.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < list.length) {
      const i = cursor;
      cursor += 1;
      out[i] = await fn(list[i], i);
    }
  };
  const size = Math.min(limit, list.length);
  await Promise.all(Array.from({ length: size }, worker));
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('maps every item, in input order', async () => {
  resetTracker();
  const out = await mapLimit(['a', 'b', 'c', 'd'], 2, fetchOne);
  eq(out, ['a0', 'b1', 'c2', 'd3']);
});

test('never runs more than `limit` at once', async () => {
  resetTracker();
  await mapLimit(['a', 'b', 'c', 'd', 'e', 'f'], 2, fetchOne);
  ok(tracker.maxInFlight <= 2, `saw ${tracker.maxInFlight} in flight`);
});

test('actually uses the whole budget', async () => {
  resetTracker();
  await mapLimit(['a', 'b', 'c', 'd', 'e', 'f'], 3, fetchOne);
  eq(tracker.maxInFlight, 3);
});

test('handles a limit larger than the list', async () => {
  resetTracker();
  eq(await mapLimit(['a', 'b'], 10, fetchOne), ['a0', 'b1']);
  eq(tracker.maxInFlight, 2);
});

test('resolves with [] for an empty list', async () => {
  resetTracker();
  eq(await mapLimit([], 2, fetchOne), []);
});

test('passes the index to the callback', async () => {
  resetTracker();
  eq(await mapLimit(['x'], 1, (item, i) => `${item}@${i}`), ['x@0']);
});

test('rejects if one of the calls fails', async () => {
  resetTracker();
  const fn = (id) =>
    id === 'c' ? Promise.reject(new Error('c broke')) : fetchOne(id, 0);
  await rejects(mapLimit(['a', 'b', 'c'], 2, fn), 'c broke');
});
