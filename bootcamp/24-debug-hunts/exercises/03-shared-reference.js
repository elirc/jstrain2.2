// ─────────────────────────────────────────────────────────────────────────
//  03 · makeBoard                                            ★☆☆ warm-up
//  concepts: reference vs copy · Array.fill · nested arrays
//  run: node 03-shared-reference.js
// ─────────────────────────────────────────────────────────────────────────
//
//  makeBoard(rows, cols, fill) builds a rows × cols grid of cells.
//  place(board, row, col, mark) writes ONE cell and returns the board.
//  render(board) joins it back into text, one line per row.
//
//      const b = makeBoard(2, 3);      render(b) → '...\n...'
//      place(b, 0, 1, 'X');            render(b) → '.X.\n...'
//
//  The code below is fully written — and wrong: 3 tests fail. Find the
//  planted bug and fix it with the smallest change that turns everything
//  green. It is one of the classic bug families; WHERE is the exercise.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function makeBoard(rows, cols, fill = '.') {
  const row = new Array(cols).fill(fill);
  return new Array(rows).fill(row);
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
