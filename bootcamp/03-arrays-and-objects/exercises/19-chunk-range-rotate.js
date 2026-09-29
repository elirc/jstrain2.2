// ─────────────────────────────────────────────────────────────────────────
//  19 · range · chunk · rotate                             ★★☆ core
//  concepts: index arithmetic · slice · modulo
//  run: node 19-chunk-range-rotate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three list builders that show up in pagination, batching and carousels.
//
//      range(0, 5)               → [0, 1, 2, 3, 4]      end is exclusive
//      range(2, 10, 3)           → [2, 5, 8]
//      range(5, 5)               → []
//      chunk([1,2,3,4,5,6,7], 3) → [[1,2,3], [4,5,6], [7]]
//      rotate(['a','b','c','d'], 1)  → ['b', 'c', 'd', 'a']
//      rotate(['a','b','c','d'], -1) → ['d', 'a', 'b', 'c']
//
//  `rotate` moves items off the front and onto the back; a shift bigger
//  than the list wraps around, and a negative shift rotates right.
//
//  hint: `((n % len) + len) % len` turns any integer, negative included,
//  into a valid offset.

import { test, eq } from '../../_lib/check.js';

export function range(start, end, step = 1) {
  throw new Error('TODO');
}

export function chunk(items, size) {
  throw new Error('TODO');
}

export function rotate(items, n) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('range counts up to but not including the end', () => {
  eq(range(0, 5), [0, 1, 2, 3, 4]);
});

test('range honours a step', () => {
  eq(range(2, 10, 3), [2, 5, 8]);
});

test('range of an empty or backwards span is empty', () => {
  eq(range(5, 5), []);
  eq(range(3, 1), []);
});

test('chunk splits into groups, last one short', () => {
  eq(chunk([1, 2, 3, 4, 5, 6, 7], 3), [[1, 2, 3], [4, 5, 6], [7]]);
});

test('chunk of an empty list is an empty list', () => {
  eq(chunk([], 3), []);
});

test('a size at least as big as the list gives one chunk', () => {
  eq(chunk([1, 2], 5), [[1, 2]]);
});

test('rotate moves items from the front to the back', () => {
  eq(rotate(['a', 'b', 'c', 'd'], 1), ['b', 'c', 'd', 'a']);
});

test('rotate wraps around and accepts negative shifts', () => {
  const letters = Object.freeze(['a', 'b', 'c', 'd']);
  eq(rotate(letters, 5), ['b', 'c', 'd', 'a']);
  eq(rotate(letters, -1), ['d', 'a', 'b', 'c']);
  eq(rotate([], 3), []);
  eq(letters, ['a', 'b', 'c', 'd']);
});
