// ─────────────────────────────────────────────────────────────────────────
//  03 · makeBoard — SOLUTION                                 ★☆☆ warm-up
//  run: node 03-shared-reference.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a shared reference. One array, pointed at three times.
//
//  The tell: `new Array(rows).fill(row)`. fill() copies the VALUE it is
//  given into every slot — and the value of `row` is a reference. So all
//  three slots hold the same array, and `board[1][2] = 'X'` is visible as
//  board[0][2] and board[2][2] too. Writing a cell writes a column.
//
//  The fix: build a new row per slot, so `fill` never gets the chance to
//  duplicate a reference:
//
//      return Array.from({ length: rows }, () => new Array(cols).fill(fill));
//
//  Array.from's second argument runs once PER INDEX, which is exactly the
//  difference. In the wild: `new Array(n).fill([])` and
//  `Object.fromEntries(keys.map(k => [k, DEFAULTS]))` are the same bug,
//  and so is a class field `items = SHARED_DEFAULT` — every instance ends
//  up pushing into one list. Clone at the boundary, always.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function makeBoard(rows, cols, fill = '.') {
  return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

export function place(board, row, col, mark) {
  if (!board[row] || board[row][col] === undefined) {
    throw new RangeError(`off the board: ${row},${col}`);
  }
  board[row][col] = mark;
  return board;
}

export function render(board) {
  return board.map((cells) => cells.join('')).join('\n');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('makeBoard has the shape you asked for', () => {
  const board = makeBoard(3, 4);
  eq(board.length, 3);
  eq(board.map((row) => row.length), [4, 4, 4]);
});

test('a fresh board is nothing but the fill value', () => {
  eq(render(makeBoard(3, 4)), '....\n....\n....');
  eq(render(makeBoard(2, 2, '0')), '00\n00');
});

test('place marks exactly one cell', () => {
  const board = makeBoard(3, 4);
  place(board, 1, 2, 'X');
  eq(render(board), '....\n..X.\n....');
});

test('two marks land on the two cells you named', () => {
  const board = makeBoard(2, 2);
  place(board, 0, 0, 'X');
  place(board, 1, 1, 'O');
  eq(render(board), 'X.\n.O');
});

test('place refuses coordinates that are off the board', () => {
  const board = makeBoard(2, 2);
  throws(() => place(board, 2, 0, 'X'), 'off the board');
  throws(() => place(board, 0, 5, 'X'), 'off the board');
  throws(() => place(board, -1, 0, 'X'), 'off the board');
});

test('boards from separate calls never share cells', () => {
  const first = makeBoard(2, 2);
  const second = makeBoard(2, 2);
  place(first, 0, 0, 'X');
  eq(render(second), '..\n..');
});

test('each row is its own array', () => {
  const board = makeBoard(3, 3);
  ok(board[0] !== board[1], 'row 0 and row 1 should be different arrays');
  ok(board[1] !== board[2], 'row 1 and row 2 should be different arrays');
});
