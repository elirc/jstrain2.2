// ─────────────────────────────────────────────────────────────────────────
//  22 · thunks and a Lazy box — SOLUTION                     ★★☆ core
//  run: node 22-lazy-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `force` is an ordinary memoised call — a `forced` flag
//  (not `value !== undefined`, which would re-run forever for a thunk that
//  legitimately returns undefined) plus a cached value.
//  `map` is the part that has to stay lazy, and the trick is that the new
//  box's thunk closes over `self.force` rather than over a value. Nothing
//  runs until somebody forces the END of the chain; that call then walks
//  backwards, forcing each source once. Each box memoises its own step, so
//  a second force of the chain costs nothing anywhere along it.
//  Classic wrong turn: `map: (fn) => lazy(() => fn(thunk()))` — it skips
//  `self.force`, so the ORIGINAL thunk runs once per mapped box instead of
//  once in total, and the memoisation quietly stops working the moment the
//  chain forks.

import { test, eq, ok, throws, spy } from '../../_lib/check.js';

export function lazy(thunk) {
  let forced = false;
  let value;
  const self = {
    map: (fn) => lazy(() => fn(self.force())),
    force: () => {
      if (!forced) {
        value = thunk();
        forced = true;
      }
      return value;
    },
  };
  return self;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('building a Lazy runs nothing', () => {
  const work = spy(() => 42);
  lazy(work);
  eq(work.callCount, 0);
});

test('force runs the thunk and returns its value', () => {
  eq(lazy(() => 42).force(), 42);
});

test('force is memoised — a second force reuses the answer', () => {
  const work = spy(() => 42);
  const value = lazy(work);
  eq(value.force(), 42);
  eq(value.force(), 42);
  eq(work.callCount, 1);
});

test('map runs nothing, not even the source', () => {
  const work = spy(() => 42);
  const double = spy((n) => n * 2);
  lazy(work).map(double).map(double);
  eq(work.callCount, 0);
  eq(double.callCount, 0);
});

test('forcing applies the whole chain, left to right', () => {
  const result = lazy(() => '  ada ')
    .map((s) => s.trim())
    .map((s) => s.toUpperCase())
    .force();
  eq(result, 'ADA');
});

test('forcing a chain twice runs each step exactly once', () => {
  const work = spy(() => 20);
  const double = spy((n) => n * 2);
  const chain = lazy(work).map(double);
  eq(chain.force(), 40);
  eq(chain.force(), 40);
  eq(work.callCount, 1);
  eq(double.callCount, 1);
});

test('map leaves the original Lazy alone', () => {
  const double = spy((n) => n * 2);
  const source = lazy(() => 5);
  const mapped = source.map(double);
  ok(mapped !== source, 'a new box');
  eq(source.force(), 5);
  eq(double.callCount, 0, 'the mapper belongs to the new box only');
  eq(mapped.force(), 10);
});

test('a thunk that throws only throws when it is forced', () => {
  const boom = lazy(() => {
    throw new Error('read failed');
  });
  const mapped = boom.map((s) => s.length);
  throws(() => mapped.force(), 'read failed');
});
