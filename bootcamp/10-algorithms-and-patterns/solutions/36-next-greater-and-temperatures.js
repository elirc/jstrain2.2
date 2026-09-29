// ─────────────────────────────────────────────────────────────────────────
//  36 · nextGreaterElements / dailyTemperatures — SOLUTION  ★★★ stretch
//  concepts: pattern: monotonic stack · stack of pending indices
//  run: node 36-next-greater-and-temperatures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: monotonic stack (here: decreasing values).
//  Smell: "for each element, the next/previous greater or smaller one" —
//  spans, stock spans, rain traps, histogram rectangles. All the same
//  machine.
//  The stack holds INDEXES whose answer is still unknown, and their values
//  are decreasing from bottom to top. When a new value arrives, every
//  pending index it beats gets its answer right now — pop them and fill
//  in. Then push the new index, still unanswered. Anything left on the
//  stack at the end never found a bigger neighbour: -1, or 0 days.
//  Time O(n) — each index is pushed once and popped at most once, so the
//  inner while loop is amortised O(1), not a nested loop. Space O(n).
//  The naive version scans right from every index: O(n²).
//  Bites: `>` (strictly greater) keeps equal values pending, which is what
//  the [2, 2, 3] test checks; `>=` would answer 2 with 2. And storing
//  values instead of indexes makes the "how many days" version impossible.

import { test, eq } from '../../_lib/check.js';

export function nextGreaterElements(nums) {
  const out = new Array(nums.length).fill(-1);
  const pending = []; // indexes whose answer is still unknown
  for (let i = 0; i < nums.length; i += 1) {
    while (
      pending.length > 0 &&
      nums[i] > nums[pending[pending.length - 1]]
    ) {
      out[pending.pop()] = nums[i];
    }
    pending.push(i);
  }
  return out;
}

export function dailyTemperatures(temps) {
  const out = new Array(temps.length).fill(0);
  const pending = [];
  for (let day = 0; day < temps.length; day += 1) {
    while (
      pending.length > 0 &&
      temps[day] > temps[pending[pending.length - 1]]
    ) {
      const waiting = pending.pop();
      out[waiting] = day - waiting;
    }
    pending.push(day);
  }
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('nextGreaterElements answers each slot', () => {
  eq(nextGreaterElements([2, 1, 2, 4, 3]), [4, 2, 4, -1, -1]);
});

test('nextGreaterElements on a rising run points at the neighbour', () => {
  eq(nextGreaterElements([1, 2, 3]), [2, 3, -1]);
});

test('nextGreaterElements gives -1 all the way down', () => {
  eq(nextGreaterElements([3, 2, 1]), [-1, -1, -1]);
});

test('nextGreaterElements needs STRICTLY greater', () => {
  eq(nextGreaterElements([2, 2, 3]), [3, 3, -1]);
  eq(nextGreaterElements([5, 5]), [-1, -1]);
});

test('nextGreaterElements handles empty and single inputs', () => {
  eq(nextGreaterElements([]), []);
  eq(nextGreaterElements([9]), [-1]);
});

test('dailyTemperatures counts days to the next warmer one', () => {
  eq(
    dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]),
    [1, 1, 4, 2, 1, 1, 0, 0]
  );
});

test('dailyTemperatures reports 0 when it never warms up', () => {
  eq(dailyTemperatures([5, 5, 5]), [0, 0, 0]);
  eq(dailyTemperatures([30, 20, 10]), [0, 0, 0]);
});

test('dailyTemperatures handles empty and single inputs', () => {
  eq(dailyTemperatures([]), []);
  eq(dailyTemperatures([40]), [0]);
});
