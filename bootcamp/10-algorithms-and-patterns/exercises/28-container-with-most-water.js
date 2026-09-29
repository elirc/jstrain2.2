// ─────────────────────────────────────────────────────────────────────────
//  28 · maxArea                                             ★★☆ core
//  concepts: pattern: two pointers (converge from the ends) · greedy move
//  run: node 28-container-with-most-water.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Each number is the height of a vertical wall standing one unit apart.
//  Pick two walls; the water they hold is the SHORTER wall times the gap
//  between them. Return the most water any pair can hold.
//
//      maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])  → 49   (walls 8 and 7, gap 7)
//      maxArea([1, 1])                       → 1
//      maxArea([5])                          → 0    (no pair, no water)
//
//  Start with the widest possible pair and close in. Only one of the two
//  walls can be worth keeping — work out which, and why moving the other
//  one can never lose you the answer.
//
//  hint: width only ever shrinks, so the only hope of a bigger area is a
//        taller SHORTER wall

import { test, eq } from '../../_lib/check.js';

export function maxArea(heights) {
  throw new Error('TODO');
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
