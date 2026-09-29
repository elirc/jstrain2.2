// ─────────────────────────────────────────────────────────────────────────
//  06 · concatAll · deepFlatten — SOLUTION                 ★★★ stretch
//  run: node 06-yield-delegation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `yield* inner` is not "yield the inner object" — it
//  drives inner to exhaustion, passing each value straight through to
//  whoever is pulling. Both functions are two lines because of it:
//  concatAll delegates to each argument in turn, deepFlatten delegates
//  to ITSELF on nested values.
//
//  The guard is the real work. `typeof value !== 'string'` stops the
//  infinite recursion on characters ('a' is an iterable containing
//  'a'), and `value?.[Symbol.iterator]` is the honest test for
//  "iterable" — Array.isArray would miss Sets, Maps and generators.
//
//  Laziness survives recursion: nothing is buffered, so a branch that
//  never ends is fine as long as the consumer stops pulling.
//
//  You flattened with recursion in 02/22 and `.flat()` in 03/16 — this
//  time laziness is the point.

import { test, eq } from '../../_lib/check.js';

// scaffolding: an endless generator, used to prove deepFlatten is lazy.
function* forever(value) {
  while (true) yield value;
}

export function* concatAll(...iterables) {
  for (const iterable of iterables) yield* iterable;
}

export function* deepFlatten(iterable) {
  for (const value of iterable) {
    const isString = typeof value === 'string';
    const inner = isString ? undefined : value?.[Symbol.iterator];
    if (typeof inner === 'function') yield* deepFlatten(value);
    else yield value;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('concatAll joins two arrays end to end', () => {
  eq([...concatAll([1, 2], [3])], [1, 2, 3]);
});

test('concatAll takes any mix of iterables', () => {
  const nested = concatAll([9]);
  eq([...concatAll([1, 2], 'ab', new Set([7, 7]), nested)], [
    1,
    2,
    'a',
    'b',
    7,
    9,
  ]);
});

test('concatAll with no arguments yields nothing', () => {
  eq([...concatAll()], []);
  eq([...concatAll([], '')], []);
});

test('deepFlatten flattens to any depth', () => {
  eq([...deepFlatten([1, [2, [3, [4]]]])], [1, 2, 3, 4]);
});

test('deepFlatten treats strings as atoms', () => {
  eq([...deepFlatten([['a'], ['bc', ['d']]])], ['a', 'bc', 'd']);
});

test('deepFlatten descends into Sets and generators too', () => {
  eq([...deepFlatten([1, new Set([2, 3]), [concatAll([4])]])], [1, 2, 3, 4]);
});

test('deepFlatten of nothing but empties is empty', () => {
  eq([...deepFlatten([])], []);
  eq([...deepFlatten([[], [[]]])], []);
});

test('deepFlatten stays lazy on an endless branch', () => {
  const it = deepFlatten([1, forever(9)])[Symbol.iterator]();
  eq([it.next().value, it.next().value, it.next().value], [1, 9, 9]);
});
