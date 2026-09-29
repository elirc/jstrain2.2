// ─────────────────────────────────────────────────────────────────────────
//  28 · maxArea — SOLUTION                                  ★★☆ core
//  concepts: pattern: two pointers (converge from the ends) · greedy move
//  run: node 28-container-with-most-water.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: two pointers converging from the ends, moving
//  the one that cannot possibly improve.
//  Smell: "best pair (i, j) where the value depends on min/max plus the
//  distance" — the widest pair is a free starting point, so start there.
//  Area = min(left, right) × (right - left). Start at the full width and
//  step the SHORTER wall inward. Why that is safe: every remaining pair
//  using the shorter wall is narrower AND still capped by that same short
//  wall, so none of them can beat the area you just measured. Discarding
//  it throws away only pairs you have already dominated.
//  Time O(n), space O(1). The naive version measures all n²/2 pairs.
//  Bites: move the shorter wall, not "the left one" — and on a TIE either
//  move is fine, but you must move exactly one, or you loop forever.

import { test, eq } from '../../_lib/check.js';

export function maxArea(heights) {
  let best = 0;
  let left = 0;
  let right = heights.length - 1;
  while (left < right) {
    const area = Math.min(heights[left], heights[right]) * (right - left);
    if (area > best) best = area;
    if (heights[left] < heights[right]) left += 1;
    else right -= 1;
  }
  return best;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the best pair in the classic input', () => {
  eq(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]), 49);
});

test('two walls hold the shorter one times the gap', () => {
  eq(maxArea([1, 1]), 1);
  eq(maxArea([4, 3]), 3);
});

test('prefers a wide pair over a tall narrow one', () => {
  eq(maxArea([1, 2, 1]), 2);
  eq(maxArea([2, 9, 9, 2]), 9);
});

test('equal heights use the full width', () => {
  eq(maxArea([3, 3, 3]), 6);
});

test('keeps looking after a tie at the ends', () => {
  eq(maxArea([4, 3, 2, 1, 4]), 16);
});

test('fewer than two walls hold nothing', () => {
  eq(maxArea([]), 0);
  eq(maxArea([5]), 0);
});

test('a zero-height wall holds nothing with anyone', () => {
  eq(maxArea([0, 0]), 0);
  eq(maxArea([0, 5, 0]), 0);
});
