// ─────────────────────────────────────────────────────────────────────────
//  36 · predicate builders — SOLUTION                      ★★☆ core
//  run: node 36-predicate-builders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `every` is AND, `some` is OR, and both already stop at the
//  first decisive answer — so the builders are adapters, not algorithms.
//  Forwarding `...args` (rather than just the first value) is what lets
//  these work as `filter` callbacks that need the index, or as two-argument
//  predicates.
//  The empty cases are not arbitrary: `allOf()` is true because there is
//  no failing predicate to point at, `anyOf()` is false because there is no
//  passing one. That is exactly what `[].every(...)` and `[].some(...)`
//  already return, so you get it for free — and it keeps the builders safe
//  to call with a filtered-down, possibly empty, list of rules.
//  `noneOf` is `negate(anyOf(...))`; writing it as `!some(...)` keeps the
//  short-circuit, whereas `every(p => !p(x))` says the same thing in a way
//  that reads backwards.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function allOf(...predicates) {
  return (...args) => predicates.every((p) => p(...args));
}

export function anyOf(...predicates) {
  return (...args) => predicates.some((p) => p(...args));
}

export function noneOf(...predicates) {
  return (...args) => !predicates.some((p) => p(...args));
}

// ── given: two tiny predicates used all over the tests ──
const isEven = (n) => n % 2 === 0;
const isBig = (n) => n > 10;

// ──────────────────────────── tests ──────────────────────────────────────

test('allOf passes only when every predicate passes', () => {
  const both = allOf(isEven, isBig);
  eq(both(12), true);
  eq(both(8), false);
  eq([8, 12, 15].filter(both), [12]);
});

test('allOf stops asking at the first failure', () => {
  const no = spy(() => false);
  const never = spy(() => true);
  eq(allOf(no, never)(1), false);
  eq(no.callCount, 1);
  eq(never.callCount, 0);
});

test('allOf with no predicates is true', () => {
  eq(allOf()(42), true);
});

test('anyOf passes when at least one predicate passes', () => {
  const either = anyOf(isEven, isBig);
  eq(either(8), true);
  eq(either(15), true);
  eq(either(7), false);
});

test('anyOf stops asking at the first success', () => {
  const yes = spy(() => true);
  const never = spy(() => false);
  eq(anyOf(yes, never)(1), true);
  eq(yes.callCount, 1);
  eq(never.callCount, 0);
});

test('anyOf with no predicates is false', () => {
  eq(anyOf()(42), false);
});

test('every predicate receives every argument', () => {
  const p1 = spy(() => true);
  const p2 = spy(() => true);
  allOf(p1, p2)('row', 3);
  eq(p1.calls, [['row', 3]]);
  eq(p2.calls, [['row', 3]]);
});

test('noneOf keeps the values no predicate claims', () => {
  eq([8, 12, 15, 7].filter(noneOf(isEven, isBig)), [7]);
  eq(noneOf(isEven)(3), true);
  ok(noneOf()(1) === true, 'nothing to object, so it passes');
});
