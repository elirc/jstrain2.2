// ─────────────────────────────────────────────────────────────────────────
//  24 · fewestCoins — SOLUTION                              ★★★ stretch
//  concepts: pattern: dynamic programming (bottom-up table) · unbounded
//  run: node 24-coin-change.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: bottom-up dynamic programming. Same two
//  properties as 23: the best way to make 11 is 1 coin plus the best way
//  to make (11 - coin), and those smaller amounts get asked for over and
//  over. So build a table from 0 up: best[0] = 0, and
//  best[a] = 1 + min(best[a - coin]) over the coins that fit.
//  Anything still Infinity at the end is unreachable → -1.
//  Time O(amount · coins), space O(amount). Top-down memoised recursion
//  is the same complexity and often easier to write first; the table is
//  just that recursion turned inside out, with no stack depth risk.
//  Two naive approaches this beats: greedy (fast but WRONG — [1,3,4] for
//  6 gives 3 coins instead of 2; the test is there to prove it), and
//  brute-force recursion over every combination, which is exponential.
//  Bites: `Infinity` as the "impossible" marker keeps `min` honest —
//  using -1 as a sentinel inside the loop turns arithmetic into nonsense.
//  And an amount of 0 must answer 0, never -1.

import { test, eq } from '../../_lib/check.js';

export function fewestCoins(coins, amount) {
  const best = new Array(amount + 1).fill(Infinity);
  best[0] = 0;
  for (let total = 1; total <= amount; total += 1) {
    for (const coin of coins) {
      if (coin <= total && best[total - coin] + 1 < best[total]) {
        best[total] = best[total - coin] + 1;
      }
    }
  }
  return best[amount] === Infinity ? -1 : best[amount];
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
