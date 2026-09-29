// ─────────────────────────────────────────────────────────────────────────
//  08 · shortCircuit — SOLUTION                                 ★★☆ core
//  run: node 08-short-circuit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both functions are a single expression, and that is the
//  point. `a && b` evaluates a; if a is falsy it returns a UNCHANGED and
//  never touches b. `a ?? b` evaluates b only when a is null or
//  undefined. This laziness is a language guarantee, not an
//  optimisation — it is why `user && user.name` was safe before `?.`
//  existed, and why `cache ?? expensiveLoad()` does not load anything
//  when the cache is a legitimately empty string.
//
//  Wrong turn: `guard ? fn() : false` returns false instead of the guard,
//  and `value || makeDefault()` calls the factory for 0 and ''.

import { test, eq, spy } from '../../_lib/check.js';

export function safeCall(guard, fn) {
  return guard && fn();
}

export function lazyDefault(value, makeDefault) {
  return value ?? makeDefault();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('safeCall runs fn when the guard is truthy', () => {
  const fn = spy(() => 'ran');
  eq(safeCall(1, fn), 'ran');
  eq(fn.callCount, 1);
});

test('safeCall returns the guard itself, not false', () => {
  const fn = () => 'ran';
  eq(safeCall(0, fn), 0);
  eq(safeCall('', fn), '');
  eq(safeCall(null, fn), null);
  eq(safeCall(undefined, fn), undefined);
});

test('safeCall never calls fn when the guard is falsy', () => {
  const fn = spy(() => 'ran');
  safeCall(0, fn);
  safeCall('', fn);
  safeCall(NaN, fn);
  eq(fn.callCount, 0);
});

test('safeCall passes through whatever fn returns, even falsy', () => {
  eq(safeCall(true, () => 0), 0);
  eq(safeCall('yes', () => null), null);
});

test('lazyDefault keeps 0, "" and false', () => {
  eq(lazyDefault(0, () => 'x'), 0);
  eq(lazyDefault('', () => 'x'), '');
  eq(lazyDefault(false, () => 'x'), false);
});

test('lazyDefault does not build a default it does not need', () => {
  const make = spy(() => 'x');
  lazyDefault(0, make);
  lazyDefault('', make);
  lazyDefault(false, make);
  eq(make.callCount, 0);
});

test('lazyDefault builds the default exactly once for nullish input', () => {
  const make = spy(() => 'built');
  eq(lazyDefault(null, make), 'built');
  eq(make.callCount, 1);
  eq(lazyDefault(undefined, make), 'built');
  eq(make.callCount, 2);
});
