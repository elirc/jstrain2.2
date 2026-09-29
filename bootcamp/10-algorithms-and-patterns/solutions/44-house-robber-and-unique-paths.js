// ─────────────────────────────────────────────────────────────────────────
//  44 · rob / uniquePaths — SOLUTION                        ★★☆ core
//  concepts: pattern: dynamic programming · 1-D table then 2-D grid
//  run: node 44-house-robber-and-unique-paths.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: bottom-up dynamic programming, first in one
//  dimension and then in two.
//  Smell: "best/most/how many ways, with a constraint linking a step to
//  the step(s) before it" — write the recurrence, then fill a table.
//  rob — the recurrence is best[i] = max(best[i-1], best[i-2] + house[i]):
//  either skip this house and keep the best so far, or take it and add the
//  best from two back. Only two numbers are ever needed, so the table
//  collapses to a pair of rolling variables. O(n) time, O(1) space.
//  The naive recursion re-asks the same suffix over and over: O(2^n).
//  Greedy "take every other house" is the classic wrong turn — [2,1,1,2]
//  answers 3 instead of 4.
//  uniquePaths — every cell is reached from above plus from the left, so
//  ways[c] += ways[c - 1] across one rolling row. O(rows · cols) time,
//  O(cols) space. Naive recursion branches twice per cell: O(2^(r+c)).
//  (The closed form is the binomial C(r + c - 2, r - 1) — say it, but the
//  table is what generalises when obstacles appear.)
//  Bite: seed the row with 1s — the first row and column have exactly one
//  route, and every other cell is built on that base case.

import { test, eq } from '../../_lib/check.js';

export function rob(houses) {
  let skip = 0; // best total up to the previous house, not taking it
  let take = 0; // best total up to and including the previous house
  for (const value of houses) {
    const next = Math.max(take, skip + value);
    skip = take;
    take = next;
  }
  return take;
}

export function uniquePaths(rows, cols) {
  const ways = new Array(cols).fill(1); // the top row: one route each
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      ways[col] += ways[col - 1]; // from above + from the left
    }
  }
  return ways[cols - 1];
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
