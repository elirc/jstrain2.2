// ─────────────────────────────────────────────────────────────────────────
//  04 · countUpTo · repeat                                  ★☆☆ warm-up
//  concepts: function* · yield
//  run: node 04-first-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A generator writes exercise 01 for you. `function*` + `yield` and
//  the engine builds the `{ value, done }` bookkeeping itself. Calling
//  a generator function runs NO code — it hands back a generator
//  object, which is both an iterator and an iterable.
//
//      [...countUpTo(5)]     → [1, 2, 3, 4, 5]
//      [...countUpTo(0)]     → []
//      [...repeat('ok', 3)]  → ['ok', 'ok', 'ok']
//
//  Careful: a generator object is ONE-SHOT. Spread it twice and the
//  second spread is empty — it is already at the end.

import { test, eq } from '../../_lib/check.js';

export function* countUpTo(limit) {
  throw new Error('TODO');
}

export function* repeat(value, times) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('countUpTo yields 1 through the limit', () => {
  eq([...countUpTo(5)], [1, 2, 3, 4, 5]);
});

test('countUpTo of 1 yields a single value', () => {
  eq([...countUpTo(1)], [1]);
});

test('countUpTo of 0 yields nothing', () => {
  eq([...countUpTo(0)], []);
  eq([...countUpTo(-3)], []);
});

test('a generator object works in for-of', () => {
  const seen = [];
  for (const n of countUpTo(3)) seen.push(n);
  eq(seen, [1, 2, 3]);
});

test('a generator object is one-shot', () => {
  const g = countUpTo(3);
  eq([...g], [1, 2, 3]);
  eq([...g], [], 'the second read finds an exhausted generator');
});

test('repeat yields the same value n times', () => {
  eq([...repeat('ok', 3)], ['ok', 'ok', 'ok']);
});

test('repeat of 0 times yields nothing', () => {
  eq([...repeat('ok', 0)], []);
});

test('Array.from works on a generator object too', () => {
  eq(Array.from(repeat(7, 2)), [7, 7]);
});
