// ─────────────────────────────────────────────────────────────────────────
//  41 · assignCookies — SOLUTION                            ★☆☆ warm-up
//  concepts: pattern: greedy matching · sort both sides, two pointers
//  run: node 41-assign-cookies.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: greedy matching over two sorted lists.
//  Smell: "pair up two sets to maximise how many pairs fit" with a simple
//  "big enough" rule — sort both and walk them with two cursors.
//  Take the least greedy child still waiting and the smallest untried
//  cookie. If the cookie fits, that is a match and both cursors advance.
//  If it does not, no later child can use it either (they are greedier),
//  so drop the cookie and keep the child.
//  Exchange argument: spending a bigger cookie on the least greedy child
//  can never beat spending the smallest one that fits — swap them and the
//  count is the same or better. That is why greedy is optimal here.
//  Time O(n log n + m log m) for the sorts, then one linear walk. Space
//  O(n + m) for the copies. The naive version tries every assignment of
//  cookies to children — factorial.
//  Bites: sort COPIES, and always pass a numeric comparator — the default
//  sort is lexicographic, so [10, 9] comes back unchanged.

import { test, eq } from '../../_lib/check.js';

export function assignCookies(greed, sizes) {
  const children = [...greed].sort((a, b) => a - b);
  const cookies = [...sizes].sort((a, b) => a - b);
  let child = 0;
  let cookie = 0;
  while (child < children.length && cookie < cookies.length) {
    if (cookies[cookie] >= children[child]) child += 1; // happy child
    cookie += 1;
  }
  return child;
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
