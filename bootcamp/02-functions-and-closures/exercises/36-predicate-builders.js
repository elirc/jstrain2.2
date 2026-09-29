// ─────────────────────────────────────────────────────────────────────────
//  36 · predicate builders                                 ★★☆ core
//  concepts: predicates · short-circuit · composition
//  run: node 36-predicate-builders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Filters grow: "active, not deleted, in this region, over 18". Written
//  inline that becomes an unreadable `&&` chain you cannot reuse or test.
//  Build the boolean algebra as functions instead.
//
//      const isEven = (n) => n % 2 === 0;
//      const isBig  = (n) => n > 10;
//
//      [8, 12, 15, 7].filter(allOf(isEven, isBig))   → [12]
//      [8, 12, 15, 7].filter(anyOf(isEven, isBig))   → [8, 12, 15]
//      [8, 12, 15, 7].filter(noneOf(isEven, isBig))  → [7]
//
//  Each builder takes any number of predicates and returns one predicate.
//  They must short-circuit — stop asking as soon as the answer is known —
//  and pass every argument they receive to each predicate. The empty cases
//  follow the maths: `allOf()` is true, `anyOf()` is false.
//
//  hint: `Array#every` and `Array#some` already short-circuit and already
//  return real booleans; the builders are one line each on top of them

import { test, eq, ok, spy } from '../../_lib/check.js';

export function allOf(...predicates) {
  throw new Error('TODO');
}

export function anyOf(...predicates) {
  throw new Error('TODO');
}

export function noneOf(...predicates) {
  throw new Error('TODO');
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
