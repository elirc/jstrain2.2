// ─────────────────────────────────────────────────────────────────────────
//  23 · mapLimit (concurrency limiter)                     ★★★ stretch
//  concepts: worker pools · concurrency control · index-keyed results
//  run: node 23-map-limit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Promise.all fires ALL the requests at once — 500 items means 500
//  sockets and a rate-limit ban. mapLimit keeps at most `limit` in
//  flight and still returns results in input order.
//
//      await mapLimit(['a','b','c','d'], 2, fetchOne)  → 4 results,
//                                                        never 3 at once
//      await mapLimit([], 2, fetchOne)                 → []
//
//  The tracker below records how many calls are running; the tests fail
//  if you ever exceed the limit — and also if you never reach it, so a
//  plain sequential loop will not pass.
//
//  hint: start `limit` workers that share one cursor over the list

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

export function mapLimit(items, limit, fn) {
  throw new Error('TODO');
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
