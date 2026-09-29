// ─────────────────────────────────────────────────────────────────────────
//  35 · dedupe (one request per key, in flight)            ★★★ stretch
//  concepts: promise reuse · keyed maps · single flight
//  run: node 35-dedupe-inflight.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Thirty components mount at once and every one of them asks for user 7.
//  You want ONE request and thirty happy callers. Build `dedupe(fn)`:
//
//      const get = dedupe(load);
//      const a = get('u1');
//      const b = get('u1');     → a === b, load called ONCE
//      await a; await get('u1') → load called again (it is not a cache)
//
//  Rules:
//    · the key is String(first argument)
//    · while a key is IN FLIGHT every caller gets the SAME promise
//    · when it settles — fulfilled or rejected — forget the key
//    · different keys never share
//
//  hint: a Map from key → promise, and one place that removes the entry
//  no matter how the promise ends.

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';

// A loader you control. Records calls, and tracks how many are running
// at the same moment so tests can prove two keys really overlap.
export function makeLoader({ fail = false, ms = 15 } = {}) {
  const fn = spy((id) => {
    fn.inFlight += 1;
    fn.peak = Math.max(fn.peak, fn.inFlight);
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        fn.inFlight -= 1;
        if (fail) reject(new Error(`load failed for ${id}`));
        else resolve(`user:${id}`);
      }, ms)
    );
  });
  fn.inFlight = 0;
  fn.peak = 0;
  return fn;
}

export function dedupe(fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('hands concurrent callers the identical promise', async () => {
  const get = dedupe(makeLoader());
  const a = get('u1');
  const b = get('u1');
  ok(a === b, 'both calls must return the same promise object');
  await a;
});

test('calls the loader once for three concurrent calls', async () => {
  const load = makeLoader();
  const get = dedupe(load);
  await Promise.all([get('u1'), get('u1'), get('u1')]);
  eq(load.callCount, 1);
});

test('gives every caller the same value', async () => {
  const get = dedupe(makeLoader());
  eq(await Promise.all([get('u1'), get('u1')]), ['user:u1', 'user:u1']);
});

test('runs different keys side by side', async () => {
  const load = makeLoader();
  const get = dedupe(load);
  eq(await Promise.all([get('u1'), get('u2')]), ['user:u1', 'user:u2']);
  eq(load.callCount, 2);
  eq(load.peak, 2, 'different keys must not queue behind each other');
});

test('forgets the key once the request settles', async () => {
  const load = makeLoader();
  const get = dedupe(load);
  await get('u1');
  await get('u1');
  eq(load.callCount, 2, 'this is in-flight dedupe, not a result cache');
});

test('delivers a rejection to every caller and caches nothing', async () => {
  const load = makeLoader({ fail: true });
  const get = dedupe(load);
  const a = get('u1');
  const b = get('u1');
  await rejects(a, 'load failed for u1');
  await rejects(b, 'load failed for u1');
  eq(load.callCount, 1);
  await rejects(get('u1'), 'load failed for u1');
  eq(load.callCount, 2, 'a failed key must be retryable');
});
