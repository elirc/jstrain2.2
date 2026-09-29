// ─────────────────────────────────────────────────────────────────────────
//  44 · rob / uniquePaths                                   ★★☆ core
//  concepts: pattern: dynamic programming · 1-D table then 2-D grid
//  run: node 44-house-robber-and-unique-paths.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two starter DP tables. Each cell answers "the best/how many ways for
//  the sub-problem ending here", built from the cells before it.
//
//  rob(houses) — take the largest total you can WITHOUT taking two
//  adjacent houses:
//
//      rob([1, 2, 3, 1])     → 4    (1 + 3)
//      rob([2, 7, 9, 3, 1])  → 12   (2 + 9 + 1)
//
//  uniquePaths(rows, cols) — count the routes from the top-left cell to
//  the bottom-right one, moving only RIGHT or DOWN:
//
//      uniquePaths(3, 7)  → 28
//      uniquePaths(3, 2)  → 3
//
//  hint: at each house the choice is "skip me" vs "take me + best two
//        back"; each grid cell is reached from above plus from the left

import { test, eq } from '../../_lib/check.js';

export function rob(houses) {
  throw new Error('TODO');
}

export function uniquePaths(rows, cols) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('rob takes the best non-adjacent set', () => {
  eq(rob([1, 2, 3, 1]), 4);
  eq(rob([2, 7, 9, 3, 1]), 12);
});

test('rob beats the alternate-houses shortcut', () => {
  eq(rob([2, 1, 1, 2]), 4);
});

test('rob handles empty, one and two houses', () => {
  eq(rob([]), 0);
  eq(rob([5]), 5);
  eq(rob([5, 9]), 9);
});

test('rob handles a run of zeros', () => {
  eq(rob([0, 0, 0]), 0);
});

test('uniquePaths counts the routes across a grid', () => {
  eq(uniquePaths(3, 7), 28);
  eq(uniquePaths(3, 2), 3);
});

test('uniquePaths of a single row or column is one route', () => {
  eq(uniquePaths(1, 1), 1);
  eq(uniquePaths(1, 10), 1);
  eq(uniquePaths(10, 1), 1);
});

test('uniquePaths is symmetric', () => {
  eq(uniquePaths(4, 6), uniquePaths(6, 4));
});

test('uniquePaths stays exact on a bigger grid', () => {
  eq(uniquePaths(10, 10), 48620);
});
