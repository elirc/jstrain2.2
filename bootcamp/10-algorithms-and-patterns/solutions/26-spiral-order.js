// ─────────────────────────────────────────────────────────────────────────
//  26 · spiralOrder — SOLUTION                              ★★★ stretch
//  concepts: pattern: matrix traversal with shrinking boundaries
//  run: node 26-spiral-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: boundary shrinking. Hold four numbers (top,
//  bottom, left, right) describing the un-read rectangle, walk its four
//  edges in order — right along the top, down the right, left along the
//  bottom, up the left — and pull each boundary in after you use it.
//  Loop while the rectangle is still non-empty.
//  Time O(rows · cols), every cell visited once; space O(1) beyond the
//  output. The naive alternative keeps a `visited` grid and a direction
//  vector that turns when it hits a wall or a visited cell — correct, but
//  it costs O(n) extra memory and much fiddlier turn logic.
//  THE bite: after walking the top row and right column, a rectangle that
//  has collapsed to one row (or one column) would be walked a second time
//  in reverse. That is why the bottom and left edges are guarded by
//  `top <= bottom` and `left <= right` — the single-row and single-column
//  tests are exactly what catches a missing guard.

import { test, eq } from '../../_lib/check.js';

export function spiralOrder(matrix) {
  const out = [];
  if (matrix.length === 0 || matrix[0].length === 0) return out;

  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col += 1) out.push(matrix[top][col]);
    top += 1;

    for (let row = top; row <= bottom; row += 1) out.push(matrix[row][right]);
    right -= 1;

    if (top <= bottom) {
      for (let col = right; col >= left; col -= 1) out.push(matrix[bottom][col]);
      bottom -= 1;
    }

    if (left <= right) {
      for (let row = bottom; row >= top; row -= 1) out.push(matrix[row][left]);
      left += 1;
    }
  }
  return out;
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
