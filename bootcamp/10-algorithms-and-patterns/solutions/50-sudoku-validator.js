// ─────────────────────────────────────────────────────────────────────────
//  50 · isValidSudoku — SOLUTION                            ★★☆ core
//  concepts: pattern: frequency counting in three groupings · box index
//  run: node 50-sudoku-validator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: frequency counting (seen-sets), one per group,
//  with an index trick to name the third group.
//  Smell: "no duplicates within each group" where every cell belongs to
//  several groups at once — seating charts, shift rosters, sudoku.
//  Keep 9 row sets, 9 column sets and 9 box sets. Walk the 81 squares
//  once; for a filled square, try to add the digit to its three sets and
//  fail fast on the first collision. Skip '.' entirely — the empty square
//  is not a value and must never be recorded.
//  The box index is the whole exercise: floor(row / 3) * 3 + floor(col / 3)
//  numbers the boxes 0..8 left to right, top to bottom. Learn that idiom,
//  it shows up in any grid-of-blocks problem.
//  Time O(81) — constant for a real sudoku, O(n²) for an n × n board.
//  Space O(n). The naive version extracts each of the 27 groups into its
//  own array and sorts or double-loops it: three passes, more allocation,
//  and the box extraction is where the off-by-one bugs live.
//  Bite: a legal board is not a solvable one. This validator only checks
//  the current squares — solving it is exercise 49's backtracking loop.

import { test, eq } from '../../_lib/check.js';

export function isValidSudoku(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const columns = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const digit = board[row][col];
      if (digit === '.') continue; // empty squares never conflict
      const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      if (
        rows[row].has(digit) ||
        columns[col].has(digit) ||
        boxes[box].has(digit)
      ) {
        return false;
      }
      rows[row].add(digit);
      columns[col].add(digit);
      boxes[box].add(digit);
    }
  }
  return true;
}

// ── fixtures ──────────────────────────────────────────────────────────────

const rowsToBoard = (rows) => rows.map((row) => row.split(''));
const blank = () => Array.from({ length: 9 }, () => new Array(9).fill('.'));

const SOLVABLE = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
];

// ──────────────────────────── tests ──────────────────────────────────────

test('accepts a legal partially filled board', () => {
  eq(isValidSudoku(rowsToBoard(SOLVABLE)), true);
});

test('accepts a completely empty board', () => {
  eq(isValidSudoku(blank()), true);
});

test('rejects a repeated digit in a row', () => {
  const board = blank();
  board[4][0] = '7';
  board[4][8] = '7';
  eq(isValidSudoku(board), false);
});

test('rejects a repeated digit in a column', () => {
  const board = rowsToBoard(SOLVABLE);
  board[0][0] = '8'; // column 0 already has an 8 in row 3
  eq(isValidSudoku(board), false);
});

test('rejects a repeated digit inside a 3×3 box', () => {
  const board = rowsToBoard(SOLVABLE);
  board[0][2] = '6'; // the top-left box already has a 6 at [1][0]
  eq(isValidSudoku(board), false);
});

test('the same digit in different rows, columns and boxes is fine', () => {
  const board = blank();
  board[0][0] = '9';
  board[4][4] = '9';
  board[8][8] = '9';
  eq(isValidSudoku(board), true);
});
