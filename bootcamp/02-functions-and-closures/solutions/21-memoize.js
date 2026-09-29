// ─────────────────────────────────────────────────────────────────────────
//  21 · memoize — SOLUTION                                 ★★☆ core
//  run: node 21-memoize.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the cache is a private Map in the closure, so each call
//  to memoize() gets its own. `cache.has(key)` is the whole trick — it
//  distinguishes "never computed" from "computed and the answer happens
//  to be 0/''/undefined", which a truthiness check cannot.
//  memoizeWith is the same shape with the key made explicit; a Map keyed
//  by strings is the usual choice because objects and arrays compare by
//  identity. Only memoize pure functions: caching something that reads a
//  file or the clock just freezes a stale answer forever.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}

export function memoizeWith(keyFn, fn) {
  const cache = new Map();
  return (...args) => {
    const key = keyFn(...args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
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
