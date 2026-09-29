// ─────────────────────────────────────────────────────────────────────────
//  50 · isValidSudoku                                       ★★☆ core
//  concepts: pattern: frequency counting in three groupings · box index
//  run: node 50-sudoku-validator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A 9 × 9 board of characters '1'–'9' and '.' for an empty square. Report
//  whether the FILLED squares break any rule: no digit twice in a row, in
//  a column, or in one of the nine 3 × 3 boxes. Empty squares never
//  conflict, and the board does not have to be solvable — only legal.
//
//      isValidSudoku(rowsToBoard(SOLVABLE))  → true
//      isValidSudoku(blank())                → true
//
//  One pass over the 81 squares is enough if you can name which box a
//  square belongs to.
//
//  hint: box index = Math.floor(row / 3) * 3 + Math.floor(col / 3)

import { test, eq } from '../../_lib/check.js';

export function isValidSudoku(board) {
  throw new Error('TODO');
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
