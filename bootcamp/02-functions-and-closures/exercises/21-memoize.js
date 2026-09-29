// ─────────────────────────────────────────────────────────────────────────
//  21 · memoize                                            ★★☆ core
//  concepts: closures · caching · spies
//  run: node 21-memoize.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Cache the answers of an expensive pure function in the closure. Same
//  argument in, cached answer out, and the original never runs twice for
//  it.
//
//      const fast = memoize(slowSquare);
//      fast(4)   → 16   (slowSquare ran)
//      fast(4)   → 16   (cache hit, slowSquare did NOT run)
//
//  memoize only has to handle ONE argument. For more, memoizeWith takes a
//  key function that turns the arguments into a cache key:
//
//      const area = memoizeWith((w, h) => `${w}x${h}`, slowArea);
//      area(3, 4)  → 12   then a second area(3, 4) is a cache hit
//
//  hint: a Map plus cache.has() — checking `if (cache[arg])` breaks the
//  moment a cached value is 0, '' or undefined

import { test, eq, ok, spy } from '../../_lib/check.js';

export function memoize(fn) {
  throw new Error('TODO');
}

export function memoizeWith(keyFn, fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the same answers as the original', () => {
  const square = memoize((n) => n * n);
  eq(square(4), 16);
  eq(square(5), 25);
  eq(square(4), 16);
});

test('computes once per distinct argument', () => {
  const fn = spy((n) => n * n);
  const square = memoize(fn);
  square(4);
  square(4);
  square(4);
  eq(fn.callCount, 1);
  eq(fn.calls, [[4]]);
});

test('each new argument is computed exactly once', () => {
  const fn = spy((n) => n * n);
  const square = memoize(fn);
  square(2);
  square(3);
  square(2);
  square(3);
  eq(fn.calls, [[2], [3]]);
});

test('caches falsy results instead of recomputing them', () => {
  const fn = spy(() => 0);
  const zero = memoize(fn);
  eq(zero('a'), 0);
  eq(zero('a'), 0);
  eq(fn.callCount, 1);
});

test('caches an undefined result too', () => {
  const fn = spy(() => undefined);
  const nothing = memoize(fn);
  eq(nothing('a'), undefined);
  eq(nothing('a'), undefined);
  eq(fn.callCount, 1);
});

test('two memoized wrappers have separate caches', () => {
  const fn = spy((n) => n * n);
  const a = memoize(fn);
  const b = memoize(fn);
  a(4);
  b(4);
  eq(fn.callCount, 2);
});

test('memoizeWith builds the key from every argument', () => {
  const keyFn = spy((w, h) => `${w}x${h}`);
  const fn = spy((w, h) => w * h);
  const area = memoizeWith(keyFn, fn);
  eq(area(3, 4), 12);
  eq(area(3, 4), 12);
  eq(keyFn.calls, [
    [3, 4],
    [3, 4],
  ]);
  eq(fn.callCount, 1);
});

test('memoizeWith treats different keys as different entries', () => {
  const fn = spy((w, h) => w * h);
  const area = memoizeWith((w, h) => `${w}x${h}`, fn);
  eq(area(3, 4), 12);
  eq(area(4, 3), 12);
  eq(fn.callCount, 2);
  ok(fn.calls.length === 2);
});
