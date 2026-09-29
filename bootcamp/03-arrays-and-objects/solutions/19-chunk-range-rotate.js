// ─────────────────────────────────────────────────────────────────────────
//  19 · range · chunk · rotate — SOLUTION                  ★★☆ core
//  run: node 19-chunk-range-rotate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `chunk` steps the index by `size` and takes a `slice` each
//  time — slice clamps at the end, so the short final chunk needs no
//  special case. `rotate` is two slices glued back together; the only real
//  work is normalising the shift, because JS `%` keeps the sign of the left
//  operand (-1 % 4 is -1, not 3), so the double-modulo dance is what makes
//  negative and oversized shifts behave. Guard the empty list: `% 0` is
//  NaN. `range` can also be written as
//  `Array.from({ length: n }, (_, i) => start + i * step)`.

import { test, eq } from '../../_lib/check.js';

export function range(start, end, step = 1) {
  const out = [];
  for (let n = start; n < end; n += step) out.push(n);
  return out;
}

export function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function rotate(items, n) {
  if (items.length === 0) return [];
  const offset = ((n % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
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
