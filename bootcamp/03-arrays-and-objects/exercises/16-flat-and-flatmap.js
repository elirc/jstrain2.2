// ─────────────────────────────────────────────────────────────────────────
//  16 · flat and flatMap                                   ★★☆ core
//  concepts: flat · flatMap · one-to-many mapping
//  run: node 16-flat-and-flatmap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `flat` unwraps nested arrays one level by default; `flatMap` is map
//  followed by one level of flat, which lets a callback return zero, one
//  or many results per input.
//
//      flattenOnce([[1, 2], [3], []])   → [1, 2, 3]
//      flattenOnce([[1, [2]], [3]])     → [1, [2], 3]     only one level
//      flattenDeep([1, [2, [3, [4]]]])  → [1, 2, 3, 4]
//      wordsOf(['hello world', 'bye'])  → ['hello', 'world', 'bye']
//      compactMap([1, 2, 3, 4], (n) => (n % 2 ? null : n * 10)) → [20, 40]
//
//  `compactMap` maps and drops the null/undefined results in one go.
//
//  hint: returning `[]` from a flatMap callback contributes nothing —
//  that is how you filter and map at the same time.

import { test, eq } from '../../_lib/check.js';

export function flattenOnce(nested) {
  throw new Error('TODO');
}

export function flattenDeep(nested) {
  throw new Error('TODO');
}

export function wordsOf(sentences) {
  throw new Error('TODO');
}

export function compactMap(items, fn) {
  throw new Error('TODO');
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
