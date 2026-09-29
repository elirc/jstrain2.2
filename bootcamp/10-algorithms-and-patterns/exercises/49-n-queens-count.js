// ─────────────────────────────────────────────────────────────────────────
//  49 · countNQueens                                        ★★★ stretch
//  concepts: pattern: backtracking with constraint sets · pruning
//  run: node 49-n-queens-count.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Place n queens on an n × n board so that no two share a row, a column
//  or a diagonal. Return HOW MANY distinct placements exist.
//
//      countNQueens(4)  → 2
//      countNQueens(8)  → 92
//      countNQueens(3)  → 0    (no legal placement)
//      countNQueens(0)  → 1    (the empty board, vacuously fine)
//
//  Place one queen per ROW — that constraint is free, so the only choice
//  per row is the column. Before recursing into the next row, check the
//  column and both diagonals; abandon the branch the moment it is illegal
//  rather than building a whole doomed board.
//
//  hint: for a cell (row, col), every square on the ↘ diagonal shares
//        `row - col` and every square on the ↙ diagonal shares `row + col`

import { test, eq, ok } from '../../_lib/check.js';

export function countNQueens(n) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a 1×1 board holds one queen', () => {
  eq(countNQueens(1), 1);
});

test('boards too small for a legal placement give 0', () => {
  eq(countNQueens(2), 0);
  eq(countNQueens(3), 0);
});

test('the classic 4×4 board has two solutions', () => {
  eq(countNQueens(4), 2);
});

test('counts the 5×5 and 6×6 boards', () => {
  eq(countNQueens(5), 10);
  eq(countNQueens(6), 4);
});

test('the full chessboard has 92 solutions', () => {
  eq(countNQueens(8), 92);
});

test('the empty board counts as one placement', () => {
  eq(countNQueens(0), 1);
});

test('prunes hard enough to finish a 9×9 board', () => {
  const solutions = countNQueens(9);
  ok(solutions === 352, `expected 352 solutions, got ${solutions}`);
});
