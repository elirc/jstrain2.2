// ─────────────────────────────────────────────────────────────────────────
//  40 · canCompleteCircuit                                  ★★★ stretch
//  concepts: pattern: greedy (restart the run) · running total
//  run: node 40-gas-station.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Stations sit in a circle. At station i you pick up gas[i] litres, and
//  driving on to the next station burns cost[i]. Your tank starts empty
//  and is unlimited. Return the index you must start from to get all the
//  way round, or -1 if no start works. At most one start ever works.
//
//      canCompleteCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2])  → 3
//      canCompleteCircuit([2, 3, 4], [3, 4, 3])              → -1
//
//  Two facts do the whole job: if the total gas is less than the total
//  cost nobody can finish, and if you run dry somewhere between i and j
//  then no station in that stretch can be the answer either.
//
//  hint: one pass, two accumulators — the overall surplus and the surplus
//        since the last restart

import { test, eq } from '../../_lib/check.js';

export function canCompleteCircuit(gas, cost) {
  throw new Error('TODO');
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
