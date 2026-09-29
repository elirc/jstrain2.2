// ─────────────────────────────────────────────────────────────────────────
//  06 · concatAll · deepFlatten                            ★★★ stretch
//  concepts: yield* · delegation · recursion
//  run: node 06-yield-delegation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `yield x` hands out one value. `yield* somethingIterable` hands out
//  ALL of its values, one at a time, then continues. That one star
//  turns a generator into a composition tool.
//
//      [...concatAll([1, 2], 'ab', new Set([9]))]
//          → [1, 2, 'a', 'b', 9]
//      [...concatAll()]              → []
//
//      [...deepFlatten([1, [2, [3, [4]]]])]      → [1, 2, 3, 4]
//      [...deepFlatten([['a'], ['bc']])]         → ['a', 'bc']
//
//  Read that last one twice. Strings are iterable, so a naive
//  deepFlatten happily explodes 'bc' into 'b', 'c' — and recurses
//  forever on the single characters. Strings are atoms here.
//
//  You flattened with recursion in 02/22 and `.flat()` in 03/16 — this
//  time laziness is the point.
//
//  hint: a value counts as "go deeper" when it is not a string and
//        value?.[Symbol.iterator] is a function

import { test, eq } from '../../_lib/check.js';

// scaffolding: an endless generator, used to prove deepFlatten is lazy.
function* forever(value) {
  while (true) yield value;
}

export function* concatAll(...iterables) {
  throw new Error('TODO');
}

export function* deepFlatten(iterable) {
  throw new Error('TODO');
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
