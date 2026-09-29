// ─────────────────────────────────────────────────────────────────────────
//  43 · shipCapacity                                        ★★★ stretch
//  concepts: pattern: binary search on the ANSWER · greedy check
//  run: node 43-ship-capacity.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Packages must ship IN ORDER, one belt, one boat per day. Return the
//  smallest boat capacity that gets everything shipped within `days` days.
//
//      shipCapacity([1,2,3,4,5,6,7,8,9,10], 5)  → 15
//      shipCapacity([3, 2, 2, 4, 1, 4], 3)      → 6
//      shipCapacity([1, 2, 3], 1)               → 6   (all in one day)
//
//  Same machine as 42, different predicate: given a capacity, greedily
//  load packages until the next one does not fit, then start a new day —
//  count the days and compare with the budget.
//
//  hint: the answer can never be below the HEAVIEST package (it has to
//        fit on its own) nor above the total weight (one single day)

import { test, eq } from '../../_lib/check.js';

export function shipCapacity(weights, days) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the smallest capacity for the classic input', () => {
  eq(shipCapacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5), 15);
});

test('packages keep their order', () => {
  eq(shipCapacity([3, 2, 2, 4, 1, 4], 3), 6);
  eq(shipCapacity([1, 2, 3, 1, 1], 4), 3);
});

test('one day means the whole load in one boat', () => {
  eq(shipCapacity([1, 2, 3], 1), 6);
});

test('a day per package means the heaviest package', () => {
  eq(shipCapacity([1, 2, 3], 3), 3);
  eq(shipCapacity([1, 2, 3], 5), 3);
});

test('the floor is the heaviest package, not the average', () => {
  eq(shipCapacity([5, 1, 1, 1], 2), 5);
});

test('handles a single package', () => {
  eq(shipCapacity([7], 1), 7);
});

test('stays fast on large weights', () => {
  eq(shipCapacity([1000000, 1000000], 2), 1000000);
});
