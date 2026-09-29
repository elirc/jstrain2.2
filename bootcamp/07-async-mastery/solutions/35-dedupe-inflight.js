// ─────────────────────────────────────────────────────────────────────────
//  35 · dedupe (one request per key, in flight) — SOLUTION ★★★ stretch
//  run: node 35-dedupe-inflight.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a promise is a VALUE, so the whole pattern is "store the
//  promise, not the result". Map lookup hits → hand back the promise you
//  already have; miss → start the work, store it, hand it back.
//  The removal is the part people get wrong. It has to happen on BOTH
//  outcomes, which is exactly what `.finally` is for, and it has to happen
//  before the promise you handed out settles — `.finally` gives you that
//  ordering for free, so `await get(k)` followed by `get(k)` really does
//  start a second request.
//  Note what this is NOT: a cache. Nothing is remembered after the request
//  finishes, so stale data is impossible — the only thing being shared is
//  the in-flight window. That is why it is safe to bolt onto a POST-ish
//  loader where a real cache would be wrong. (Exercise 51 keeps the
//  successes, which is a different contract on purpose.)
//  Wrong turn: `map.set(key, result)` inside a `.then`. By then every
//  concurrent caller has already missed the map and started its own
//  request — you cached the answer and deduped nothing.

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
  const inFlight = new Map();

  return (...args) => {
    const key = String(args[0]);
    const running = inFlight.get(key);
    if (running) return running;

    const promise = Promise.resolve(fn(...args)).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, promise);
    return promise;
  };
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
