// ─────────────────────────────────────────────────────────────────────────
//  38 · maxNonOverlapping                                   ★★☆ core
//  concepts: pattern: greedy on intervals · sort by EARLIEST END
//  run: node 38-max-non-overlapping.js
// ─────────────────────────────────────────────────────────────────────────
//
//  One room, a pile of [start, end] bookings. Accept as many as you can.
//  Ends are exclusive, so [1, 3] and [3, 5] both fit.
//
//      maxNonOverlapping([[1, 3], [2, 4], [3, 5]])          → 2
//      maxNonOverlapping([[1, 2], [2, 3], [3, 4], [1, 3]])  → 3
//      maxNonOverlapping([[1, 10], [2, 3], [4, 5]])         → 2
//
//  Sorting by start time and taking greedily is WRONG — one long booking
//  at the front eats the whole day. Sort by something else and the greedy
//  choice becomes provably safe.
//
//  hint: whichever booking frees the room soonest leaves the most room
//        for everything after it

import { test, eq } from '../../_lib/check.js';

export function maxNonOverlapping(bookings) {
  throw new Error('TODO');
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
