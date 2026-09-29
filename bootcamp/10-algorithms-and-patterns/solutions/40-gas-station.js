// ─────────────────────────────────────────────────────────────────────────
//  40 · canCompleteCircuit — SOLUTION                       ★★★ stretch
//  concepts: pattern: greedy (restart the run) · running total
//  run: node 40-gas-station.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: greedy one-pass with a restart, the same shape
//  as Kadane's maximum-subarray scan.
//  Smell: "find the starting point of a circular route" / "a running
//  balance that must never go negative".
//  Work with surpluses: gas[i] - cost[i]. Two claims:
//   1. If the total surplus is negative, no start can finish. If it is
//      >= 0 some start CAN — so you only need to find which.
//   2. If the tank runs dry travelling from `start` to station i, then no
//      station in start..i works either: each of them begins with an even
//      emptier tank than the run that already failed. Skip the lot and
//      restart at i + 1 with an empty tank.
//  One pass, O(n) time, O(1) space. The naive version simulates a full
//  lap from every station: O(n²).
//  Bites: reset the running tank to 0 on restart (not to the current
//  surplus), and answer from the TOTAL surplus — the last candidate index
//  is only valid because claim 1 says an answer exists at all.

import { test, eq } from '../../_lib/check.js';

export function canCompleteCircuit(gas, cost) {
  if (gas.length === 0) return -1;
  let total = 0;
  let tank = 0;
  let start = 0;
  for (let i = 0; i < gas.length; i += 1) {
    const surplus = gas[i] - cost[i];
    total += surplus;
    tank += surplus;
    if (tank < 0) {
      start = i + 1; // nothing in start..i can be the answer
      tank = 0;
    }
  }
  return total >= 0 ? start : -1;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the only viable starting station', () => {
  eq(canCompleteCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]), 3);
});

test('returns -1 when the trip is impossible', () => {
  eq(canCompleteCircuit([2, 3, 4], [3, 4, 3]), -1);
});

test('works when the surplus is exactly zero', () => {
  eq(canCompleteCircuit([2, 3, 4], [3, 4, 2]), 2);
});

test('starts at 0 when every station is a fine start', () => {
  eq(canCompleteCircuit([3, 3, 3], [1, 1, 1]), 0);
});

test('finds an answer at the last station', () => {
  eq(canCompleteCircuit([1, 1, 1, 5], [2, 2, 2, 1]), 3);
});

test('handles a single station', () => {
  eq(canCompleteCircuit([5], [4]), 0);
  eq(canCompleteCircuit([3], [4]), -1);
});

test('handles no stations at all', () => {
  eq(canCompleteCircuit([], []), -1);
});
