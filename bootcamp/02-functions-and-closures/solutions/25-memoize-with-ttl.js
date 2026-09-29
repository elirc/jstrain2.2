// ─────────────────────────────────────────────────────────────────────────
//  25 · memoize with a TTL — SOLUTION                      ★★☆ core
//  run: node 25-memoize-with-ttl.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two things live in the closure — the Map and the injected
//  clock. Each entry carries its own timestamp, so expiry is a subtraction
//  at read time rather than a timer you have to cancel. Note the shape of
//  the check: `has(key)` first (a cached `undefined` or `0` is a real hit),
//  then the age test. Re-stamping on recompute is what makes the TTL a
//  sliding one — forget it and every entry dies forever after its first
//  window. `now = Date.now` as a default parameter keeps production calls
//  short while the tests stay deterministic; hard-coding Date.now inside
//  would make this function untestable without faking global time.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function memoizeTtl(fn, ttlMs, now = Date.now) {
  const cache = new Map();
  return (arg) => {
    if (cache.has(arg)) {
      const entry = cache.get(arg);
      if (now() - entry.storedAt < ttlMs) return entry.value;
    }
    const value = fn(arg);
    cache.set(arg, { value, storedAt: now() });
    return value;
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('computes once per argument inside the window', () => {
  let clock = 0;
  const fn = spy((k) => `v:${k}`);
  const cached = memoizeTtl(fn, 100, () => clock);
  eq(cached('a'), 'v:a');
  clock = 60;
  eq(cached('a'), 'v:a');
  eq(fn.callCount, 1);
});

test('recomputes once the entry is older than the ttl', () => {
  let clock = 0;
  const fn = spy((k) => `${k}${clock}`);
  const cached = memoizeTtl(fn, 100, () => clock);
  eq(cached('a'), 'a0');
  clock = 150;
  eq(cached('a'), 'a150');
  eq(fn.callCount, 2);
});

test('an entry exactly ttlMs old counts as stale', () => {
  let clock = 0;
  const fn = spy(() => 1);
  const cached = memoizeTtl(fn, 100, () => clock);
  cached('a');
  clock = 100;
  cached('a');
  eq(fn.callCount, 2);
});

test('a recompute re-stamps the entry', () => {
  let clock = 0;
  const fn = spy(() => 1);
  const cached = memoizeTtl(fn, 100, () => clock);
  cached('a');
  clock = 100;
  cached('a');
  clock = 180;
  cached('a');
  eq(fn.callCount, 2, 'the entry stored at 100 is still fresh at 180');
});

test('caches falsy and undefined results instead of recomputing', () => {
  let clock = 0;
  const zero = spy(() => 0);
  const cachedZero = memoizeTtl(zero, 100, () => clock);
  eq(cachedZero('a'), 0);
  eq(cachedZero('a'), 0);
  eq(zero.callCount, 1);

  const nothing = spy(() => undefined);
  const cachedNothing = memoizeTtl(nothing, 100, () => clock);
  eq(cachedNothing('a'), undefined);
  eq(cachedNothing('a'), undefined);
  eq(nothing.callCount, 1);
});

test('each argument gets its own entry and its own clock stamp', () => {
  let clock = 0;
  const fn = spy((k) => k);
  const cached = memoizeTtl(fn, 100, () => clock);
  cached('a');
  clock = 50;
  cached('b');
  clock = 120;
  cached('a');
  cached('b');
  eq(fn.calls, [['a'], ['b'], ['a']], 'b was stored at 50, still fresh');
});

test('falls back to a real clock when none is injected', () => {
  const fn = spy((k) => k.toUpperCase());
  const cached = memoizeTtl(fn, 60_000);
  eq(cached('a'), 'A');
  eq(cached('a'), 'A');
  eq(fn.callCount, 1);
});
