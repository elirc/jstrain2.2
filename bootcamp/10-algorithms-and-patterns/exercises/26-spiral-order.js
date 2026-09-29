// ─────────────────────────────────────────────────────────────────────────
//  26 · spiralOrder                                         ★★★ stretch
//  concepts: pattern: matrix traversal with shrinking boundaries
//  run: node 26-spiral-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Read a grid clockwise from the outside in, returning a flat array.
//
//      [[1, 2, 3],
//       [4, 5, 6],     → [1, 2, 3, 6, 9, 8, 7, 4, 5]
//       [7, 8, 9]]
//
//      [[1, 2, 3]]     → [1, 2, 3]
//      []              → []
//
//  Rows and columns can differ, and the grid can be a single row or a
//  single column. Do not mutate the input.
//
//  hint: keep four boundaries — top, bottom, left, right — and after
//  walking each edge, pull that boundary in by one. The bites are the
//  final single row and single column: check that top <= bottom and
//  left <= right BEFORE walking the return edges

import { test, eq } from '../../_lib/check.js';

export function spiralOrder(matrix) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('walks a 3 x 3 grid clockwise', () => {
  const grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];
  eq(spiralOrder(grid), [1, 2, 3, 6, 9, 8, 7, 4, 5]);
});

test('handles a wide grid (more columns than rows)', () => {
  const grid = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ];
  eq(spiralOrder(grid), [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]);
});

test('handles a tall grid (more rows than columns)', () => {
  const grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
  ];
  eq(spiralOrder(grid), [1, 2, 3, 6, 9, 12, 11, 10, 7, 4, 5, 8]);
});

test('handles a single row', () => {
  eq(spiralOrder([[1, 2, 3]]), [1, 2, 3]);
});

test('handles a single column', () => {
  eq(spiralOrder([[1], [2], [3]]), [1, 2, 3]);
});

test('handles empty grids and a single cell', () => {
  eq(spiralOrder([]), []);
  eq(spiralOrder([[]]), []);
  eq(spiralOrder([[7]]), [7]);
});

test('does not mutate the grid', () => {
  const grid = [
    [1, 2],
    [3, 4],
  ];
  spiralOrder(grid);
  eq(grid, [
    [1, 2],
    [3, 4],
  ]);
});
