// ─────────────────────────────────────────────────────────────────────────
//  31 · BST queries: kth smallest and closest — SOLUTION    ★★☆ core
//  run: node 31-bst-queries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: kthSmallest is an in-order walk with a counter and an
//  early return. In-order emits values in ascending order, so the kth one
//  emitted IS the answer — and you stop there. That costs O(h + k), not
//  O(n): for "the 3 cheapest" on a million-row index you touch a few dozen
//  nodes. Flattening to an array first is O(n) time and O(n) memory, and
//  sorting an unordered array would be O(n log n) — you already paid for
//  the order when you built the tree, so spend it.
//  The explicit stack (instead of recursion) keeps the memory at O(h) and
//  makes the early exit trivial — no exception-throwing to escape a
//  callback halfway through.
//  closestValue is a pure descent: at each node record it if it beats the
//  best so far, then go left or right exactly as a search would. O(h) —
//  log n on a balanced tree. The subtlety is that the answer may be an
//  ANCESTOR of where the walk dead-ends (target 21 ends at 25 but 20 is
//  nearer), so you compare at every step, not only at the end.
//  Classic wrong turn: forgetting the tie rule, which makes the result
//  depend on the shape of the tree rather than on the data.

import { test, eq } from '../../_lib/check.js';

const insert = (root, value) => {
  if (root === null) return { value, left: null, right: null };
  if (value < root.value) root.left = insert(root.left, value);
  else if (value > root.value) root.right = insert(root.right, value);
  return root;
};

const treeOf = (...values) => values.reduce((root, v) => insert(root, v), null);

//         20
//        /  \
//      10    30          in-order → 5 10 15 20 25 30 35
//     / \   /  \
//    5  15 25  35
const prices = treeOf(20, 10, 30, 5, 15, 25, 35);

export function kthSmallest(root, k) {
  if (!Number.isInteger(k) || k < 1) return undefined;

  const stack = [];
  let current = root;
  let seen = 0;

  while (current !== null || stack.length > 0) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }
    current = stack.pop();
    seen += 1;
    if (seen === k) return current.value;
    current = current.right;
  }
  return undefined;
}

export function closestValue(root, target) {
  if (root === null) return undefined;

  let best = root.value;
  let current = root;

  while (current !== null) {
    const gap = Math.abs(current.value - target);
    const bestGap = Math.abs(best - target);
    if (gap < bestGap || (gap === bestGap && current.value < best)) {
      best = current.value;
    }
    if (target === current.value) return current.value;
    current = target < current.value ? current.left : current.right;
  }
  return best;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('kthSmallest counts from one', () => {
  eq(kthSmallest(prices, 1), 5, 'the minimum');
  eq(kthSmallest(prices, 4), 20);
  eq(kthSmallest(prices, 7), 35, 'the maximum');
});

test('kthSmallest returns undefined outside the tree', () => {
  eq(kthSmallest(prices, 0), undefined);
  eq(kthSmallest(prices, -1), undefined);
  eq(kthSmallest(prices, 8), undefined);
  eq(kthSmallest(null, 1), undefined);
});

test('kthSmallest survives a degenerate right-leaning chain', () => {
  const chain = treeOf(1, 2, 3, 4, 5);
  eq(kthSmallest(chain, 3), 3);
  eq(kthSmallest(chain, 5), 5);
});

test('closestValue lands on an exact match', () => {
  eq(closestValue(prices, 25), 25);
  eq(closestValue(prices, 5), 5);
});

test('closestValue picks the nearer of the two neighbours', () => {
  eq(closestValue(prices, 26), 25);
  eq(closestValue(prices, 28), 30);
  eq(closestValue(prices, 12), 10);
  eq(closestValue(prices, 13), 15);
});

test('the closest value can be an ancestor, not the last node visited', () => {
  eq(closestValue(prices, 21), 20, 'the descent ends at 25, but 20 is nearer');
});

test('targets outside the range clamp, and ties prefer the smaller', () => {
  eq(closestValue(prices, -5), 5);
  eq(closestValue(prices, 99), 35);
  eq(closestValue(prices, 22.5), 20, 'exactly between 20 and 25');
  eq(closestValue(null, 3), undefined);
});

test('application: the 3rd cheapest listing, and snapping a slider', () => {
  eq(kthSmallest(prices, 3), 15, 'page 1 of a cheapest-first listing');
  eq(closestValue(prices, 27), 25, 'the slider snaps to a real price');
});
