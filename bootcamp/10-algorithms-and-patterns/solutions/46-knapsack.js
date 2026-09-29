// ─────────────────────────────────────────────────────────────────────────
//  46 · knapsack — SOLUTION                                 ★★★ stretch
//  concepts: pattern: 0/1 knapsack DP · each item used at most once
//  run: node 46-knapsack.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: 0/1 knapsack — DP over (items × capacity).
//  Smell: "pick a subset under a budget to maximise something" — budget,
//  weight, time, memory. Subset-sum and partition-into-equal-halves are
//  the same table with values = weights.
//  best[cap] holds the most value reachable with that much room using the
//  items considered so far. For each item, for each capacity that still
//  fits it: best[cap] = max(best[cap], best[cap - weight] + value).
//  Walking capacities DOWNWARD is what makes it 0/1: best[cap - weight] is
//  then still "before this item", so the item cannot be picked twice.
//  Walk upward and you get the UNBOUNDED knapsack (exercise 24's coins),
//  which is a different problem and the classic wrong turn here.
//  Time O(items · capacity), space O(capacity) — the 2-D table collapses
//  to one row because each row only reads the row above it.
//  Beats brute force over all 2^n subsets. Beats greedy by value density
//  too: [3,4,5] / [30,50,60] with capacity 8 gives greedy 80, optimal 90.
//  Note this is "pseudo-polynomial" — the cost tracks the capacity NUMBER,
//  not its digit count. Say that out loud; it is the follow-up question.

import { test, eq } from '../../_lib/check.js';

export function knapsack(weights, values, capacity) {
  const best = new Array(capacity + 1).fill(0);
  for (let item = 0; item < weights.length; item += 1) {
    for (let cap = capacity; cap >= weights[item]; cap -= 1) {
      const withItem = best[cap - weights[item]] + values[item];
      if (withItem > best[cap]) best[cap] = withItem;
    }
  }
  return best[capacity];
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
