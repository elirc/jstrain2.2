// ─────────────────────────────────────────────────────────────────────────
//  45 · editDistance                                        ★★★ stretch
//  concepts: pattern: 2-D dynamic programming grid · three-way choice
//  run: node 45-edit-distance.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The fewest single-character edits — insert, delete or replace — that
//  turn `from` into `to`. This is the number behind spell checkers, fuzzy
//  search and `git diff`.
//
//      editDistance('horse', 'ros')          → 3
//      editDistance('intention', 'execution') → 5
//      editDistance('abc', 'abc')            → 0
//
//  Build a grid: cell [i][j] is the distance between the first i letters
//  of `from` and the first j letters of `to`. Matching letters cost
//  nothing and step diagonally; otherwise take the cheapest of the three
//  neighbours and pay 1.
//
//  hint: row 0 and column 0 are not zeros — turning '' into 'abc' costs 3

import { test, eq } from '../../_lib/check.js';

export function editDistance(from, to) {
  throw new Error('TODO');
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
