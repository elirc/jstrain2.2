// ─────────────────────────────────────────────────────────────────────────
//  45 · editDistance — SOLUTION                             ★★★ stretch
//  concepts: pattern: 2-D dynamic programming grid · three-way choice
//  run: node 45-edit-distance.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: 2-D DP over two sequences (exercise 25's grid,
//  with a minimise instead of a maximise).
//  Smell: "turn X into Y with the fewest operations" / any question about
//  two strings where the answer for a prefix pair builds on shorter
//  prefix pairs.
//  grid[i][j] = distance between from[0..i) and to[0..j). Equal last
//  letters cost nothing: copy the diagonal. Otherwise pay 1 and take the
//  cheapest of the three moves — delete (i-1, j), insert (i, j-1),
//  replace (i-1, j-1). The base row and column are 0..n: turning a string
//  into '' costs one delete per letter.
//  Time O(n · m), space O(n · m) — or O(min(n, m)) with two rolling rows,
//  which is the follow-up they ask for. The naive recursion re-solves the
//  same prefix pairs exponentially: roughly O(3^n).
//  Bites: an empty base row of zeros silently makes every distance 0, and
//  mixing up which neighbour is the insert and which is the delete still
//  gives the right NUMBER here (the operations are symmetric) but breaks
//  the moment you try to reconstruct the actual edit script.

import { test, eq } from '../../_lib/check.js';

export function editDistance(from, to) {
  const rows = from.length;
  const cols = to.length;
  const grid = Array.from({ length: rows + 1 }, () =>
    new Array(cols + 1).fill(0)
  );
  for (let i = 0; i <= rows; i += 1) grid[i][0] = i; // delete everything
  for (let j = 0; j <= cols; j += 1) grid[0][j] = j; // insert everything

  for (let i = 1; i <= rows; i += 1) {
    for (let j = 1; j <= cols; j += 1) {
      if (from[i - 1] === to[j - 1]) {
        grid[i][j] = grid[i - 1][j - 1]; // free match
      } else {
        grid[i][j] =
          1 +
          Math.min(
            grid[i - 1][j], // delete from[i-1]
            grid[i][j - 1], // insert to[j-1]
            grid[i - 1][j - 1] // replace
          );
      }
    }
  }
  return grid[rows][cols];
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the classic three-edit distance', () => {
  eq(editDistance('horse', 'ros'), 3);
});

test('handles the longer classic pair', () => {
  eq(editDistance('intention', 'execution'), 5);
});

test('identical strings cost nothing', () => {
  eq(editDistance('abc', 'abc'), 0);
  eq(editDistance('', ''), 0);
});

test('an empty side costs the other length', () => {
  eq(editDistance('', 'abc'), 3);
  eq(editDistance('abcd', ''), 4);
});

test('a single replace beats delete plus insert', () => {
  eq(editDistance('a', 'b'), 1);
  eq(editDistance('cat', 'cut'), 1);
});

test('counts pure inserts and pure deletes', () => {
  eq(editDistance('cat', 'cats'), 1);
  eq(editDistance('cats', 'cat'), 1);
});

test('is symmetric', () => {
  eq(editDistance('sunday', 'saturday'), 3);
  eq(editDistance('saturday', 'sunday'), 3);
});
