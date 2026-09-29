// ─────────────────────────────────────────────────────────────────────────
//  36 · nextGreaterElements / dailyTemperatures             ★★★ stretch
//  concepts: pattern: monotonic stack · stack of pending indices
//  run: node 36-next-greater-and-temperatures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two questions with one shape: "for each item, what is the next bigger
//  thing to my right?" Keep a stack of items still waiting for an answer.
//
//  nextGreaterElements(nums) — the next STRICTLY greater value to the
//  right of each slot, or -1 if there isn't one:
//
//      nextGreaterElements([2, 1, 2, 4, 3])  → [4, 2, 4, -1, -1]
//
//  dailyTemperatures(temps) — how many days until a warmer day, 0 if the
//  warm day never comes:
//
//      dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])
//        → [1, 1, 4, 2, 1, 1, 0, 0]
//
//  hint: push INDEXES, not values — daily temperatures needs the distance,
//        and while the new value beats the top of the stack, pop and
//        answer that index

import { test, eq } from '../../_lib/check.js';

export function nextGreaterElements(nums) {
  throw new Error('TODO');
}

export function dailyTemperatures(temps) {
  throw new Error('TODO');
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
