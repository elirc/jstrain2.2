// ─────────────────────────────────────────────────────────────────────────
//  02 · range — a plain object you can for-of — SOLUTION     ★★☆ core
//  run: node 02-range-iterable.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `[Symbol.iterator]` is just a method with a computed
//  key. Everything that consumes an iterable — for-of, spread,
//  Array.from, destructuring — calls it and then drives `next()`.
//
//  The important line is `let current = start;` INSIDE the method. Put
//  the cursor there and every call hands out a fresh, independent
//  iterator, so the object stays re-iterable. Hoist it up to range()'s
//  body instead and the second `[...r]` silently returns [] — the
//  classic wrong turn, and exactly how a used-up generator behaves
//  (exercise 04).

import { test, eq, ok } from '../../_lib/check.js';

export function range(start, end, step = 1) {
  return {
    start,
    end,
    step,
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if (current >= end) return { value: undefined, done: true };
          const value = current;
          current += step;
          return { value, done: false };
        },
      };
    },
  };
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
