// ─────────────────────────────────────────────────────────────────────────
//  43 · shipCapacity — SOLUTION                             ★★★ stretch
//  concepts: pattern: binary search on the ANSWER · greedy check
//  run: node 43-ship-capacity.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: binary search on the answer, with a GREEDY
//  feasibility check inside it.
//  Smell: "minimise the maximum" — smallest capacity, smallest largest
//  chunk, minimum time. Any of those phrasings is this pattern.
//  daysNeeded(capacity) loads packages in order until the next one would
//  overflow, then opens a new day. Greedy is optimal for the check:
//  leaving space in today's boat can never reduce the number of days.
//  Feasibility is monotone — a bigger boat never needs more days — so
//  binary search the capacity range.
//  Bounds matter: low = max(weights), because a package must fit whole,
//  and high = sum(weights), the one-day boat. Starting at low = 1 also
//  works but wastes steps and invites an infinite loop if the check is
//  written carelessly.
//  Time O(n log(sum - max)), space O(1). The naive version walks capacity
//  upward one unit at a time: O(n · sum).
//  Bite: the split is contiguous — you may NOT sort the weights. Sorting
//  is the wrong-turn that makes [3,2,2,4,1,4] answer 5 instead of 6.

import { test, eq } from '../../_lib/check.js';

export function shipCapacity(weights, days) {
  const daysNeeded = (capacity) => {
    let used = 1;
    let load = 0;
    for (const weight of weights) {
      if (load + weight > capacity) {
        used += 1;
        load = 0;
      }
      load += weight;
    }
    return used;
  };

  let low = Math.max(...weights);
  let high = weights.reduce((total, weight) => total + weight, 0);
  let best = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (daysNeeded(mid) <= days) {
      best = mid; // roomy enough — try smaller
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return best;
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
