// ─────────────────────────────────────────────────────────────────────────
//  41 · labeled loops — SOLUTION                                ★★☆ core
//  run: node 41-labeled-loops.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a label is just a name attached to a statement, and
//  `break label` / `continue label` say which loop you meant. That is the
//  whole feature. It replaces the `let found = false` flag threaded
//  through two loop conditions — the version everyone writes first and
//  then gets subtly wrong when the flag is checked one iteration late.
//
//  findCell could also `return` straight out of the nested loop, and often
//  that is cleaner. Labels earn their place when you need to keep going
//  after the jump — like sumCleanRows, which abandons the current row and
//  carries on with the next one.
//
//  Object.is instead of === is what lets findCell match NaN. The cost is
//  that it also distinguishes 0 from -0, which for a grid search is the
//  correct trade.

import { test, eq } from '../../_lib/check.js';

const GRID = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

export function findCell(grid, target) {
  let found = null;
  search: for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (Object.is(grid[row][col], target)) {
        found = { row, col };
        break search;
      }
    }
  }
  return found;
}

export function sumCleanRows(grid) {
  let total = 0;
  rows: for (const row of grid) {
    let rowTotal = 0;
    for (const cell of row) {
      if (cell < 0) continue rows; // drop everything counted for this row
      rowTotal += cell;
    }
    total += rowTotal;
  }
  return total;
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
