// ─────────────────────────────────────────────────────────────────────────
//  22 · thunks and a Lazy box                                ★★☆ core
//  concepts: thunks · deferred evaluation · memoisation
//  run: node 22-lazy-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A thunk is a zero-argument function that stands in for a value you have
//  not computed yet: `() => expensiveThing()`. Wrap one in a small box with
//  `map` and `force` and you can describe a whole calculation — cheaply,
//  in one place — and pay for it only if somebody actually asks.
//
//      const config = lazy(() => readHugeFile());   // nothing happens yet
//      const port = config.map((c) => c.port);      // still nothing
//      port.force();                                // NOW it reads
//      port.force();                                // cached — reads once
//
//  Build lazy(thunk) returning an object with:
//      map(fn)   a NEW Lazy for fn(thisValue). Runs nothing.
//      force()   compute (once!) and return the value
//
//  Forcing must be memoised all the way down the chain: forcing a mapped
//  Lazy twice runs the original thunk once and each mapper once.
//
//  hint: `map` does not need the value — it only needs to remember how to
//  get it later. Build the new Lazy around a thunk that calls force.

import { test, eq, ok, throws, spy } from '../../_lib/check.js';

export function lazy(thunk) {
  throw new Error('TODO');
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
