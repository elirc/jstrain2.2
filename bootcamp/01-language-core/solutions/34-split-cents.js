// ─────────────────────────────────────────────────────────────────────────
//  34 · splitting cents — SOLUTION                              ★★☆ core
//  run: node 34-split-cents.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: splitCents is `Math.floor` plus `%`. The quotient is what
//  everyone gets; the remainder is exactly how many people get one more.
//  Because both come from integer arithmetic, the parts provably sum to
//  the total — no rounding, nothing to reconcile.
//
//  The sign is handled last and only for non-zero parts, because `-1 * 0`
//  is `-0` and `deepStrictEqual([-0], [0])` fails. That is the same -0
//  wart Object.is exists to expose.
//
//  allocate is the largest-remainder (Hamilton) method: floor each exact
//  share, then give the leftover units to the largest fractional parts.
//  Ties break by index so the result is deterministic — an allocation that
//  depends on sort stability is a bug you cannot reproduce. The naive
//  `Math.round(total * w / sum)` fails both ways: it can hand out more
//  than the total, or less.

import { test, eq, throws } from '../../_lib/check.js';

export function splitCents(total, ways) {
  if (!Number.isInteger(ways) || ways < 1) {
    throw new RangeError(`ways must be an integer >= 1, got ${ways}`);
  }
  const abs = Math.abs(total);
  const base = Math.floor(abs / ways);
  const extra = abs % ways;
  return Array.from({ length: ways }, (_, i) => {
    const part = base + (i < extra ? 1 : 0);
    if (part === 0) return 0;
    return total < 0 ? -part : part;
  });
}

export function allocate(total, weights) {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`total must be a whole number >= 0: ${total}`);
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) throw new RangeError('weights must not sum to zero');

  const exact = weights.map((weight) => (total * weight) / sum);
  const parts = exact.map(Math.floor);
  let left = total - parts.reduce((a, b) => a + b, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);

  for (const { index } of byRemainder) {
    if (left === 0) break;
    parts[index] += 1;
    left -= 1;
  }
  return parts;
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
