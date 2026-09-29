// ─────────────────────────────────────────────────────────────────────────
//  28 · sliding window maximum — SOLUTION                   ★★★ stretch
//  run: node 28-sliding-window-max.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the deque holds indices whose values strictly decrease, so
//  the front is always the maximum of the current window. Two rules keep
//  that true. Before pushing i, pop from the BACK while those values are
//  <= nums[i]: they are older AND smaller, so no future window can ever
//  pick them over i. Then drop the FRONT if it has fallen out of the
//  window (deque[head] <= i - k).
//  Each index is pushed once and removed once, so the whole thing is O(n)
//  time even though there is a loop inside a loop — amortised, not
//  per-step. Space is O(k). The naive re-scan is O(n·k), which on a metric
//  stream with k = 300 is 300x more work for the same answer.
//  The deque is an array with a `head` index, never shift(): shift()
//  reindexes the whole array and would quietly restore the O(n²).
//  Classic wrong turn: storing VALUES instead of indices. Values cannot
//  tell you when the front has aged out of the window, and you end up
//  reporting a maximum that left the window three steps ago.

import { test, eq, ok } from '../../_lib/check.js';

export function maxSlidingWindow(nums, k) {
  if (!Array.isArray(nums) || k < 1 || k > nums.length) return [];

  const deque = []; // indices, values decreasing front → back
  let head = 0;
  const maxima = [];

  for (let i = 0; i < nums.length; i += 1) {
    while (deque.length > head && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop();
    }
    deque.push(i);
    if (deque[head] <= i - k) head += 1; // the front aged out
    if (i >= k - 1) maxima.push(nums[deque[head]]);
  }
  return maxima;
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
