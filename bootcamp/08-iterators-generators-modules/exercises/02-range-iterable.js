// ─────────────────────────────────────────────────────────────────────────
//  02 · range — a plain object you can for-of                ★★☆ core
//  concepts: Symbol.iterator · for-of · spread
//  run: node 02-range-iterable.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An ITERABLE is any object with a `[Symbol.iterator]()` method that
//  returns an iterator (exercise 01). for-of, spread, Array.from and
//  destructuring all call that one method.
//
//  Build range(start, end, step = 1): a plain object that carries its
//  own fields AND knows how to iterate itself. `end` is exclusive.
//
//      [...range(1, 4)]        → [1, 2, 3]
//      [...range(0, 10, 3)]    → [0, 3, 6, 9]
//      [...range(5, 5)]        → []
//      range(2, 5).start       → 2
//
//  It must be re-iterable: two separate for-of loops each start over.
//
//  hint: build the object literal first, then add a computed key
//        [Symbol.iterator]() that returns a FRESH cursor each call

import { test, eq, ok } from '../../_lib/check.js';

export function range(start, end, step = 1) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('spreads into an array', () => {
  eq([...range(1, 4)], [1, 2, 3]);
});

test('works in a for-of loop', () => {
  const seen = [];
  for (const n of range(3, 6)) seen.push(n);
  eq(seen, [3, 4, 5]);
});

test('honours a step', () => {
  eq([...range(0, 10, 3)], [0, 3, 6, 9]);
});

test('is empty when start is not below end', () => {
  eq([...range(5, 5)], []);
  eq([...range(9, 2)], []);
});

test('is a plain object with its own fields, not an array', () => {
  const r = range(2, 5);
  eq(r.start, 2);
  eq(r.end, 5);
  ok(!Array.isArray(r), 'range should not return an array');
});

test('can be iterated twice — each loop gets a fresh iterator', () => {
  const r = range(1, 4);
  eq([...r], [1, 2, 3]);
  eq([...r], [1, 2, 3]);
});

test('Array.from and destructuring use the same protocol', () => {
  eq(Array.from(range(1, 4)), [1, 2, 3]);
  const [first, second] = range(10, 100, 5);
  eq([first, second], [10, 15]);
});
