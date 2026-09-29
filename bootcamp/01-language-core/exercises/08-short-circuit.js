// ─────────────────────────────────────────────────────────────────────────
//  08 · shortCircuit                                            ★★☆ core
//  concepts: && · || · ?? · lazy evaluation
//  run: node 08-short-circuit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  &&, || and ?? are not boolean operators — they are value-picking
//  operators, and they refuse to evaluate the right-hand side unless they
//  have to. Build two helpers that show both halves of that.
//
//      safeCall(true, () => 'ran')  → 'ran'
//      safeCall(0, () => 'ran')     → 0     (the guard itself, fn unused)
//      safeCall('', () => 'ran')    → ''
//
//      lazyDefault('', () => 'x')   → ''    (the factory never runs)
//      lazyDefault(0, () => 'x')    → 0
//      lazyDefault(null, () => 'x') → 'x'
//
//  hint: `guard && fn()` and `value ?? make()` already do all of this —
//  including not running the right side. Write the expression, not an if.

import { test, eq, spy } from '../../_lib/check.js';

export function safeCall(guard, fn) {
  throw new Error('TODO');
}

export function lazyDefault(value, makeDefault) {
  throw new Error('TODO');
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
