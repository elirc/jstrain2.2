// ─────────────────────────────────────────────────────────────────────────
//  46 · knapsack                                            ★★★ stretch
//  concepts: pattern: 0/1 knapsack DP · each item used at most once
//  run: node 46-knapsack.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A bag that carries `capacity` units of weight and a list of items,
//  where item i weighs weights[i] and is worth values[i]. Each item can
//  be taken ONCE or left behind — no splitting, no repeats. Return the
//  most value the bag can hold.
//
//      knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7)  → 9    (items 3 + 4)
//      knapsack([3, 4, 5], [30, 50, 60], 8)     → 90   (items 3 + 5)
//      knapsack([2], [5], 10)                   → 5    (only one of it)
//
//  The choice per item is binary: skip it, or take it and spend its
//  weight. Note the second example — grabbing the best value-per-weight
//  item first gets you 80, not 90.
//
//  hint: one array indexed by remaining capacity, one item at a time; walk
//        the capacities BACKWARDS so an item cannot be taken twice

import { test, eq } from '../../_lib/check.js';

export function knapsack(weights, values, capacity) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('picks the best combination that fits', () => {
  eq(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7), 9);
});

test('beats the greedy value-per-weight answer', () => {
  eq(knapsack([3, 4, 5], [30, 50, 60], 8), 90);
});

test('uses each item at most once', () => {
  eq(knapsack([2], [5], 10), 5);
});

test('takes everything when everything fits', () => {
  eq(knapsack([1, 2, 3], [10, 20, 30], 6), 60);
});

test('takes nothing when nothing fits', () => {
  eq(knapsack([5, 6], [10, 20], 4), 0);
});

test('a capacity of 0 holds nothing', () => {
  eq(knapsack([1, 2], [10, 20], 0), 0);
});

test('handles an empty item list', () => {
  eq(knapsack([], [], 10), 0);
});

test('prefers one heavy prize over two light ones', () => {
  eq(knapsack([1, 1, 5], [1, 1, 10], 5), 10);
});
