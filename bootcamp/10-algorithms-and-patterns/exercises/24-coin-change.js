// ─────────────────────────────────────────────────────────────────────────
//  24 · fewestCoins                                         ★★★ stretch
//  concepts: pattern: dynamic programming (bottom-up table) · unbounded
//  run: node 24-coin-change.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Given coin denominations (unlimited supply of each) and an amount,
//  return the FEWEST coins that add up to it exactly, or -1 if it cannot
//  be done.
//
//      fewestCoins([1, 2, 5], 11)  → 3    (5 + 5 + 1)
//      fewestCoins([1, 3, 4], 6)   → 2    (3 + 3)
//      fewestCoins([2], 3)         → -1
//      fewestCoins([1, 2, 5], 0)   → 0
//
//  Greedy — "always take the biggest coin that fits" — is WRONG here:
//  for [1, 3, 4] and 6 it takes 4 + 1 + 1 = 3 coins, missing 3 + 3.
//  Greedy happens to work for real-world currencies, which is exactly
//  why this trap catches people.
//
//  hint: best[amount] = 1 + min(best[amount - coin]) over every coin
//  that fits. Build best[] from 0 upwards; seed unreachable with Infinity

import { test, eq } from '../../_lib/check.js';

export function fewestCoins(coins, amount) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the fewest coins for a simple amount', () => {
  eq(fewestCoins([1, 2, 5], 11), 3);
});

test('beats the greedy answer when greedy is wrong', () => {
  eq(fewestCoins([1, 3, 4], 6), 2);
});

test('an amount of 0 needs no coins', () => {
  eq(fewestCoins([1, 2, 5], 0), 0);
  eq(fewestCoins([], 0), 0);
});

test('returns -1 when the amount cannot be made', () => {
  eq(fewestCoins([2], 3), -1);
});

test('returns -1 when every coin is too big', () => {
  eq(fewestCoins([5, 10], 3), -1);
});

test('returns -1 when there are no coins at all', () => {
  eq(fewestCoins([], 5), -1);
});

test('does not care what order the coins come in', () => {
  eq(fewestCoins([25, 1, 10, 5], 30), 2);
});

test('handles a larger amount', () => {
  eq(fewestCoins([1, 5, 10, 25], 99), 9);
});
