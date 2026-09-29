// ─────────────────────────────────────────────────────────────────────────
//  25 · memoize with a TTL                                 ★★☆ core
//  concepts: closures · caching · injected clock
//  run: node 25-memoize-with-ttl.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A plain memoize caches forever, which is wrong for anything that can go
//  stale — an exchange rate, a feature flag, a config blob. Add an expiry:
//  an entry is dead once it is `ttlMs` old (age >= ttlMs), and the next
//  call recomputes and re-stamps it.
//
//  Time comes in as a parameter so the tests can control it — the same
//  trick you use to keep clocks out of your business logic:
//
//      let clock = 0;
//      const rate = memoizeTtl(load, 100, () => clock);
//      rate('usd')              → runs load, stamped at 0
//      clock = 60;  rate('usd') → cache hit, load did NOT run
//      clock = 100; rate('usd') → stale, load runs again
//
//  One argument is enough — key the cache on it.
//
//  hint: store `{ value, storedAt }` per key and compare `now() - storedAt`
//  against ttlMs; `cache.has(key)` is still the only safe hit test

import { test, eq, ok, spy } from '../../_lib/check.js';

export function memoizeTtl(fn, ttlMs, now = Date.now) {
  throw new Error('TODO');
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
