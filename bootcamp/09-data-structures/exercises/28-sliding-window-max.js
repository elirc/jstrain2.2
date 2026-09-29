// ─────────────────────────────────────────────────────────────────────────
//  28 · sliding window maximum                              ★★★ stretch
//  concepts: monotonic deque · amortised O(n) · head index
//  run: node 28-sliding-window-max.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Slide a window of width k along an array and report the maximum inside
//  it at every position. Re-scanning each window is O(n·k) — fine for a
//  demo, hopeless on a metrics stream. Do it in one pass.
//
//      maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)
//        → [3, 3, 5, 5, 6, 7]
//      maxSlidingWindow([9, 1, 2, 3], 2)   → [9, 2, 3]
//      maxSlidingWindow([1, 2], 5)         → []      (window too wide)
//      maxSlidingWindow([], 3)             → []
//
//  Keep a deque (double-ended queue) of INDICES whose values decrease from
//  front to back: the front is the current winner. Store indices, not
//  values, so you can tell when the front has slid out of the window.
//  Use an array plus a `head` index — this module's rule: never shift().
//
//  hint: before pushing index i, drop every index off the BACK whose value
//  is <= nums[i] — a smaller value that arrived earlier can never win again

import { test, eq, ok } from '../../_lib/check.js';

export function maxSlidingWindow(nums, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reports the maximum of every window', () => {
  eq(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3), [3, 3, 5, 5, 6, 7]);
});

test('a window of one is a copy of the input', () => {
  const nums = [4, 1, 7];
  const out = maxSlidingWindow(nums, 1);
  eq(out, [4, 1, 7]);
  ok(out !== nums, 'a new array, not the one you were handed');
});

test('a window as wide as the array yields one overall maximum', () => {
  eq(maxSlidingWindow([2, 9, 4], 3), [9]);
});

test('an impossible window gives an empty result', () => {
  eq(maxSlidingWindow([], 3), []);
  eq(maxSlidingWindow([1, 2], 5), []);
  eq(maxSlidingWindow([1, 2], 0), []);
});

test('a big early value stops counting once it slides out', () => {
  eq(maxSlidingWindow([9, 1, 2, 3], 2), [9, 2, 3]);
  eq(maxSlidingWindow([9, 1, 1, 1], 2), [9, 1, 1]);
});

test('monotone runs report their first or last element', () => {
  eq(maxSlidingWindow([5, 4, 3, 2, 1], 2), [5, 4, 3, 2]);
  eq(maxSlidingWindow([1, 2, 3, 4], 2), [2, 3, 4]);
});

test('duplicates and negatives behave', () => {
  eq(maxSlidingWindow([2, 2, 2], 2), [2, 2]);
  eq(maxSlidingWindow([-1, -3, -2], 2), [-1, -2]);
});

test('application: peak CPU load in every rolling 3-minute window', () => {
  const load = [12, 40, 33, 31, 90, 55, 61, 70];
  eq(maxSlidingWindow(load, 3), [40, 40, 90, 90, 90, 70]);
  eq(Math.max(...maxSlidingWindow(load, 3)), 90, 'the worst minute overall');
});
