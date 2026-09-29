// ─────────────────────────────────────────────────────────────────────────
//  41 · assignCookies                                       ★☆☆ warm-up
//  concepts: pattern: greedy matching · sort both sides, two pointers
//  run: node 41-assign-cookies.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Each child has a greed factor and each cookie has a size. A child is
//  happy if their cookie is at least as big as their greed. One cookie
//  per child. Return the largest number of happy children.
//
//      assignCookies([1, 2, 3], [1, 1])  → 1
//      assignCookies([1, 2], [1, 2, 3])  → 2
//      assignCookies([10], [1, 2, 3])    → 0
//
//  Sort both lists, then walk them together: give the smallest cookie
//  that works to the least greedy child still waiting. Neither input may
//  be modified.

import { test, eq } from '../../_lib/check.js';

export function assignCookies(greed, sizes) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('feeds as many children as the cookies allow', () => {
  eq(assignCookies([1, 2, 3], [1, 1]), 1);
});

test('feeds everyone when the cookies are big enough', () => {
  eq(assignCookies([1, 2], [1, 2, 3]), 2);
});

test('works on unsorted input', () => {
  eq(assignCookies([3, 1, 2], [2, 2]), 2);
});

test('feeds nobody when every cookie is too small', () => {
  eq(assignCookies([10], [1, 2, 3]), 0);
});

test('handles empty children or empty cookies', () => {
  eq(assignCookies([], [1, 2]), 0);
  eq(assignCookies([1, 2], []), 0);
});

test('an exact match counts as happy', () => {
  eq(assignCookies([5], [5]), 1);
});

test('does not modify the inputs', () => {
  const greed = [3, 1, 2];
  const sizes = [2, 2];
  assignCookies(greed, sizes);
  eq(greed, [3, 1, 2]);
  eq(sizes, [2, 2]);
});
