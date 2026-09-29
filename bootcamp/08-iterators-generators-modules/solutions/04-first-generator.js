// ─────────────────────────────────────────────────────────────────────────
//  04 · countUpTo · repeat — SOLUTION                       ★☆☆ warm-up
//  run: node 04-first-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the loop is ordinary; `yield` is the only new part. It
//  hands a value out and freezes the function — locals, loop counter
//  and all — until someone calls next() again.
//
//  Note what you did NOT write: no `{ value, done }`, no cursor object,
//  no [Symbol.iterator]. A generator object already has all three, which
//  is why spread and for-of accept it directly.
//
//  countUpTo(0) yielding nothing falls out for free: the loop condition
//  is false on the first check, the function returns, done is true.

import { test, eq } from '../../_lib/check.js';

export function* countUpTo(limit) {
  for (let n = 1; n <= limit; n += 1) yield n;
}

export function* repeat(value, times) {
  for (let i = 0; i < times; i += 1) yield value;
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
