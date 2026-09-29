// ─────────────────────────────────────────────────────────────────────────
//  38 · maxNonOverlapping — SOLUTION                        ★★☆ core
//  concepts: pattern: greedy on intervals · sort by EARLIEST END
//  run: node 38-max-non-overlapping.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: interval scheduling greedy, sorted by end time.
//  Smell: "the most non-overlapping intervals" / "fewest to delete so the
//  rest don't overlap" (that answer is n minus this one).
//  Sort by end, then sweep: take a booking whenever it starts at or after
//  the last taken end, and move the fence. The exchange-argument proof is
//  the thing to say out loud: if an optimal schedule doesn't start with
//  the earliest-ending booking, swap its first booking for that one — it
//  frees the room no later, so the rest of the schedule still fits, and
//  the count is unchanged. Greedy is therefore safe.
//  Time O(n log n) for the sort, space O(n) for the copy.
//  Sorting by START is the classic wrong turn: [[1, 10], [2, 3], [4, 5]]
//  takes the ten-hour booking and answers 1 instead of 2. Sorting by
//  DURATION is wrong too — a short booking can straddle two others.
//  Bite: `start >= lastEnd` (not `>`) is what lets touching bookings chain.

import { test, eq } from '../../_lib/check.js';

export function maxNonOverlapping(bookings) {
  const byEnd = [...bookings].sort((a, b) => a[1] - b[1]);
  let taken = 0;
  let lastEnd = -Infinity;
  for (const [start, end] of byEnd) {
    if (start >= lastEnd) {
      taken += 1;
      lastEnd = end;
    }
  }
  return taken;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('drops the booking that overlaps two others', () => {
  eq(maxNonOverlapping([[1, 3], [2, 4], [3, 5]]), 2);
});

test('chains touching bookings back to back', () => {
  eq(maxNonOverlapping([[1, 2], [2, 3], [3, 4], [1, 3]]), 3);
});

test('prefers two short bookings over one long one', () => {
  eq(maxNonOverlapping([[1, 10], [2, 3], [4, 5]]), 2);
});

test('identical bookings can only be taken once', () => {
  eq(maxNonOverlapping([[1, 4], [1, 4], [1, 4]]), 1);
});

test('takes everything when nothing overlaps', () => {
  eq(maxNonOverlapping([[5, 6], [1, 2], [3, 4]]), 3);
});

test('handles empty and single-booking inputs', () => {
  eq(maxNonOverlapping([]), 0);
  eq(maxNonOverlapping([[0, 100]]), 1);
});

test('does not modify the input', () => {
  const bookings = [[3, 5], [1, 3]];
  maxNonOverlapping(bookings);
  eq(bookings, [[3, 5], [1, 3]]);
});
