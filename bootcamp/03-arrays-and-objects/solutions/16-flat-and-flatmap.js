// ─────────────────────────────────────────────────────────────────────────
//  16 · flat and flatMap — SOLUTION                        ★★☆ core
//  run: node 16-flat-and-flatmap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `flat()` defaults to depth 1; `flat(Infinity)` goes all the
//  way down, which is the only sane answer when the nesting depth is
//  unknown. `flatMap` is the one-to-many tool: return an array of many for
//  a split, an array of one to keep, an empty array to drop. That last
//  trick makes `compactMap` a single pass instead of `.map(...).filter(...)`
//  with a temporary array in between. Note `flatMap` only flattens ONE
//  level, so a callback returning nested arrays still leaves nesting.

import { test, eq } from '../../_lib/check.js';

export function flattenOnce(nested) {
  return nested.flat();
}

export function flattenDeep(nested) {
  return nested.flat(Infinity);
}

export function wordsOf(sentences) {
  return sentences.flatMap((sentence) => sentence.split(' '));
}

export function compactMap(items, fn) {
  return items.flatMap((item, i) => {
    const value = fn(item, i);
    return value === null || value === undefined ? [] : [value];
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('flattenOnce merges the inner arrays', () => {
  eq(flattenOnce([[1, 2], [3], []]), [1, 2, 3]);
});

test('flattenOnce stops after one level', () => {
  eq(flattenOnce([[1, [2]], [3]]), [1, [2], 3]);
});

test('flattenDeep keeps going all the way down', () => {
  eq(flattenDeep([1, [2, [3, [4, [5]]]]]), [1, 2, 3, 4, 5]);
});

test('flattenDeep of an already flat array changes nothing', () => {
  eq(flattenDeep([1, 2, 3]), [1, 2, 3]);
});

test('wordsOf splits every sentence into the same flat list', () => {
  eq(wordsOf(['hello world', 'bye']), ['hello', 'world', 'bye']);
});

test('wordsOf of an empty list is an empty list', () => {
  eq(wordsOf([]), []);
});

test('compactMap drops null and undefined results', () => {
  eq(compactMap([1, 2, 3, 4], (n) => (n % 2 ? null : n * 10)), [20, 40]);
});

test('compactMap keeps falsy values that are not null', () => {
  eq(compactMap([1, 2, 3], (n) => (n === 2 ? 0 : undefined)), [0]);
});
