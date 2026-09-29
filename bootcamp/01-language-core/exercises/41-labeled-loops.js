// ─────────────────────────────────────────────────────────────────────────
//  41 · labeled loops                                           ★★☆ core
//  concepts: labels · break label · continue label · Object.is
//  run: node 41-labeled-loops.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A plain `break` only leaves the loop it is in. From a nested loop that
//  means a `found` flag, an extra `if` in the outer condition, and a bug
//  waiting to happen. A label fixes it: name the outer loop and break or
//  continue THAT one.
//
//      findCell(GRID, 6)     → { row: 1, col: 2 }
//      findCell(GRID, 99)    → null
//      findCell([[1, NaN]], NaN) → { row: 0, col: 1 }
//
//  findCell scans row by row, left to right, and stops the moment it
//  matches — including a match on NaN, which `===` can never make.
//
//  sumCleanRows(grid) adds up every cell, but skips ENTIRE rows that
//  contain a negative number — the "this record is corrupt, next record"
//  shape that `continue outer` exists for:
//
//      sumCleanRows([[1, 2], [3, -1], [4]])  → 7
//      sumCleanRows([[-1]])                  → 0
//
//  hint: `outer: for (...) { for (...) { break outer; } }`. The label goes
//  in front of the statement, and `continue label` restarts the labelled
//  loop rather than the innermost one. Object.is is the equality that
//  admits NaN.

import { test, eq } from '../../_lib/check.js';

const GRID = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

export function findCell(grid, target) {
  throw new Error('TODO');
}

export function sumCleanRows(grid) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('findCell locates a value in the first row', () => {
  eq(findCell(GRID, 1), { row: 0, col: 0 });
  eq(findCell(GRID, 3), { row: 0, col: 2 });
});

test('findCell reports both coordinates from a later row', () => {
  eq(findCell(GRID, 6), { row: 1, col: 2 });
  eq(findCell(GRID, 7), { row: 2, col: 0 });
  eq(findCell(GRID, 9), { row: 2, col: 2 });
});

test('no match is null, and ragged or empty grids are fine', () => {
  eq(findCell(GRID, 99), null);
  eq(findCell([], 1), null);
  eq(findCell([[], []], 1), null);
  eq(findCell([[], [5]], 5), { row: 1, col: 0 });
});

test('findCell can find NaN, which === never matches', () => {
  eq(findCell([[1, NaN], [2]], NaN), { row: 0, col: 1 });
  eq(NaN === NaN, false);
  eq(findCell([[undefined]], undefined), { row: 0, col: 0 });
});

test('break with a label leaves the outer loop as well', () => {
  eq(findCell(GRID, 1), { row: 0, col: 0 });
  const seen = [];
  outer: for (const row of GRID) {
    for (const cell of row) {
      seen.push(cell);
      if (cell === 2) break outer;
    }
  }
  eq(seen, [1, 2]);
});

test('continue with a label starts the next OUTER iteration', () => {
  eq(findCell(GRID, 1), { row: 0, col: 0 });
  let visited = 0;
  outer: for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      visited += 1;
      if (j === 1) continue outer;
    }
    visited += 100; // never reached
  }
  eq(visited, 6);
});

test('sumCleanRows skips a whole row that holds a negative', () => {
  eq(sumCleanRows([[1, 2], [3, -1], [4]]), 7);
  eq(sumCleanRows(GRID), 45);
  eq(sumCleanRows([[1, 2, -3], [10]]), 10);
});

test('sumCleanRows copes with empty rows and an empty grid', () => {
  eq(sumCleanRows([]), 0);
  eq(sumCleanRows([[]]), 0);
  eq(sumCleanRows([[-1]]), 0);
  eq(sumCleanRows([[], [5]]), 5);
});
