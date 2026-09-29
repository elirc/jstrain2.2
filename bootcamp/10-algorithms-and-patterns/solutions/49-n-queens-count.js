// ─────────────────────────────────────────────────────────────────────────
//  49 · countNQueens — SOLUTION                             ★★★ stretch
//  concepts: pattern: backtracking with constraint sets · pruning
//  run: node 49-n-queens-count.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: backtracking with O(1) constraint checks.
//  Smell: "place/assign things so that no two conflict" — n-queens, sudoku
//  solving, graph colouring, exam timetabling. All the same loop.
//  Two ideas do the work. First, bake a constraint into the SHAPE of the
//  search: one queen per row means the recursion is "pick a column for
//  row r", and the row conflict can never happen. Second, keep three Sets
//  — used columns, used ↘ diagonals (row - col) and used ↙ diagonals
//  (row + col) — so "is this square attacked?" is three lookups, not a
//  scan of the board.
//  Then it is the usual ritual: choose (add to the three sets), explore
//  (recurse into row + 1), un-choose (delete from all three).
//  Time is exponential but the pruning is everything: n = 8 visits a few
//  thousand nodes instead of the 8^8 = 16.7 million placements the naive
//  "generate every board, then validate" approach walks through.
//  Space O(n) for the sets and the recursion depth.
//  Bites: un-choose ALL THREE sets or later rows inherit ghost attacks;
//  and `row - col` goes negative, which is fine for a Set but breaks a
//  plain array index — the classic off-by-n is forgetting the `+ n` shift
//  if you use arrays instead.

import { test, eq, ok } from '../../_lib/check.js';

export function countNQueens(n) {
  const columns = new Set();
  const downRight = new Set(); // row - col
  const downLeft = new Set(); // row + col
  let solutions = 0;

  const place = (row) => {
    if (row === n) {
      solutions += 1;
      return;
    }
    for (let col = 0; col < n; col += 1) {
      if (
        columns.has(col) ||
        downRight.has(row - col) ||
        downLeft.has(row + col)
      ) {
        continue; // attacked — prune this whole branch
      }
      columns.add(col); // choose
      downRight.add(row - col);
      downLeft.add(row + col);
      place(row + 1); // explore
      columns.delete(col); // un-choose
      downRight.delete(row - col);
      downLeft.delete(row + col);
    }
  };

  place(0);
  return solutions;
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
