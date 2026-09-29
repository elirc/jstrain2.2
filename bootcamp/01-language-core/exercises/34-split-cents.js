// ─────────────────────────────────────────────────────────────────────────
//  34 · splitting cents                                         ★★☆ core
//  concepts: integer division · remainders · -0 · largest remainder
//  run: node 34-split-cents.js
// ─────────────────────────────────────────────────────────────────────────
//
//  £10.00 split three ways is not £3.33 each — that loses a penny. The
//  parts must add back up to the total, exactly, every time.
//
//      splitCents(1000, 3)  → [334, 333, 333]      sum 1000
//      splitCents(10, 4)    → [3, 3, 2, 2]         sum 10
//      splitCents(900, 3)   → [300, 300, 300]
//      splitCents(-1000, 3) → [-334, -333, -333]
//      splitCents(-1, 3)    → [-1, 0, 0]      a zero part is +0, not -0
//
//  The leftover pennies go to the FRONT of the list, one each. `ways` must
//  be an integer of at least 1; anything else throws a RangeError whose
//  message mentions 'ways'.
//
//  allocate(total, weights) does the same job proportionally, using the
//  largest-remainder method: floor every share, then hand the leftover
//  units to the shares with the biggest fractional parts, ties going to
//  the earlier index.
//
//      allocate(500, [3, 1])    → [375, 125]
//      allocate(100, [1, 1, 1]) → [34, 33, 33]
//      allocate(7, [1, 1])      → [4, 3]
//
//  `total` must be a non-negative integer and the weights must not sum to
//  zero; both refusals are RangeErrors ('total', 'weights').
//
//  hint: `-1 * 0` is `-0`, and deep equality can tell -0 from 0. Build the
//  part as a positive number and decide the sign last.

import { test, eq, throws } from '../../_lib/check.js';

export function splitCents(total, ways) {
  throw new Error('TODO');
}

export function allocate(total, weights) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an even split gives everyone the same amount', () => {
  eq(splitCents(900, 3), [300, 300, 300]);
  eq(splitCents(5, 1), [5]);
  eq(splitCents(0, 3), [0, 0, 0]);
});

test('the remainder goes to the front and the parts still add up', () => {
  eq(splitCents(1000, 3), [334, 333, 333]);
  eq(splitCents(10, 4), [3, 3, 2, 2]);
  for (const [total, ways] of [[1000, 3], [10, 4], [1, 7], [99, 5]]) {
    const parts = splitCents(total, ways);
    eq(parts.length, ways);
    eq(parts.reduce((a, b) => a + b, 0), total, `${total} in ${ways} ways`);
  }
});

test('a negative total keeps its sign — and never produces -0', () => {
  eq(splitCents(-1000, 3), [-334, -333, -333]);
  eq(splitCents(-10, 4), [-3, -3, -2, -2]);
  eq(splitCents(-1, 3), [-1, 0, 0]);
});

test('a nonsense number of ways is refused', () => {
  throws(() => splitCents(100, 0), 'ways');
  throws(() => splitCents(100, -2), 'ways');
  throws(() => splitCents(100, 2.5), 'ways');
});

test('allocate splits in proportion to the weights', () => {
  eq(allocate(500, [3, 1]), [375, 125]);
  eq(allocate(1000, [1, 1, 1]), [334, 333, 333]);
  eq(allocate(0, [1, 2]), [0, 0]);
});

test('the largest remainders collect the leftover units', () => {
  eq(allocate(100, [1, 1, 1]), [34, 33, 33]);
  eq(allocate(7, [1, 1]), [4, 3]);
  eq(allocate(10, [1, 2, 3]), [2, 3, 5]);
});

test('every allocation adds back up to the total', () => {
  const cases = [[100, [1, 1, 1]], [7, [1, 1]], [999, [5, 3, 2]],
    [1, [1, 1, 1, 1]]];
  for (const [total, weights] of cases) {
    const parts = allocate(total, weights);
    eq(parts.length, weights.length);
    eq(parts.reduce((a, b) => a + b, 0), total, `total ${total}`);
  }
});

test('a zero weight gets nothing, and impossible inputs are refused', () => {
  eq(allocate(1000, [1, 0, 1]), [500, 0, 500]);
  throws(() => allocate(10, [0, 0]), 'weights');
  throws(() => allocate(-5, [1, 1]), 'total');
});
