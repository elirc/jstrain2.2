// ─────────────────────────────────────────────────────────────────────────
//  23 · a lazy list from closures                            ★★☆ core
//  concepts: laziness · closures · infinite sequences
//  run: node 23-lazy-list.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An array has to exist in full before you can map it. A lazy list does
//  not: it is a function that, when called, hands you ONE element plus a
//  function for the rest. Nothing past that point exists yet, so the list
//  is allowed to be infinite — you just stop asking.
//
//      A lazy list is a thunk:
//          () => null                      the end
//          () => ({ head, tail })          tail is another lazy list
//
//      const naturals = iterate(1, (n) => n + 1);   // 1, 2, 3, ...
//      take(3, naturals)                            → [1, 2, 3]
//      take(3, lazyMap((n) => n * 10, naturals))    → [10, 20, 30]
//      take(3, lazyFilter(isEven, naturals))        → [2, 4, 6]
//
//  Build:
//      iterate(seed, next)     seed, next(seed), next(next(seed)), ...
//      take(n, list)           an ARRAY of at most the first n elements
//      lazyMap(fn, list)       a lazy list — must not compute anything
//      lazyFilter(pred, list)  a lazy list — same rule
//
//  `fn` must run exactly once per element that gets taken, and not once
//  for any element that does not — and `iterate` must not call `next`
//  until a cell is actually forced.
//
//  hint: every one of these returns `() => ...` and does its work INSIDE
//  that arrow. `take` is the only one allowed to be a loop.

import { test, eq, spy } from '../../_lib/check.js';

// ── given: the empty list, and a finite list from an array ───────────────

const nil = () => null;

const fromArray = (items) =>
  items.length === 0
    ? nil
    : () => ({ head: items[0], tail: fromArray(items.slice(1)) });

export function iterate(seed, next) {
  throw new Error('TODO');
}

export function take(n, list) {
  throw new Error('TODO');
}

export function lazyMap(fn, list) {
  throw new Error('TODO');
}

export function lazyFilter(pred, list) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('take pulls the first n out of an infinite list', () => {
  eq(take(4, iterate(1, (n) => n + 1)), [1, 2, 3, 4]);
  eq(take(3, iterate(1, (n) => n * 2)), [1, 2, 4]);
});

test('take(0) forces nothing at all', () => {
  const next = spy((n) => n + 1);
  eq(take(0, iterate(1, next)), []);
  eq(next.callCount, 0);
});

test('take stops early when the list runs out', () => {
  eq(take(10, fromArray(['a', 'b'])), ['a', 'b']);
  eq(take(3, nil), []);
});

test('lazyMap computes nothing until you take', () => {
  const double = spy((n) => n * 2);
  lazyMap(double, iterate(1, (n) => n + 1));
  eq(double.callCount, 0);
});

test('the mapper runs once per element taken, and no more', () => {
  const double = spy((n) => n * 2);
  eq(take(3, lazyMap(double, iterate(1, (n) => n + 1))), [2, 4, 6]);
  eq(double.callCount, 3, 'not once for every natural number');
});

test('lazyFilter skips ahead through an infinite list', () => {
  const naturals = iterate(1, (n) => n + 1);
  eq(take(4, lazyFilter((n) => n % 3 === 0, naturals)), [3, 6, 9, 12]);
});

test('map and filter compose, still lazily', () => {
  const naturals = iterate(1, (n) => n + 1);
  const pipeline = lazyMap(
    (n) => `#${n}`,
    lazyFilter((n) => n % 2 === 0, naturals)
  );
  eq(take(3, pipeline), ['#2', '#4', '#6']);
});

test('filtering everything out of a finite list ends politely', () => {
  eq(take(3, lazyFilter((n) => n > 100, fromArray([1, 2, 3]))), []);
  eq(take(2, lazyMap((n) => n + 1, nil)), []);
});
