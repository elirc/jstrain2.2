// ─────────────────────────────────────────────────────────────────────────
//  31 · BST queries: kth smallest and closest               ★★☆ core
//  concepts: in-order traversal · early exit · descent
//  run: node 31-bst-queries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two questions an ordered index gets asked constantly. Neither one is
//  allowed to flatten the whole tree first.
//
//  kthSmallest(root, k) — the kth smallest value, counting from 1. Stop
//  the moment you have it; k is usually tiny and the tree is not.
//      kthSmallest(prices, 1)   → 5        kthSmallest(prices, 4)   → 20
//      kthSmallest(prices, 0)   → undefined
//      kthSmallest(prices, 99)  → undefined
//
//  closestValue(root, target) — the value nearest to `target`, which may
//  not be in the tree at all. On an exact tie prefer the SMALLER value.
//      closestValue(prices, 26)  → 25      closestValue(prices, 21) → 20
//      closestValue(prices, -5)  → 5       closestValue(null, 3) → undefined
//
//  hint: in-order visits values in ascending order, so kthSmallest is a
//  counter with a return in the middle of it; closest is a plain descent
//  that remembers the best value it has walked past

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
  throw new Error('TODO');
}

export function closestValue(root, target) {
  throw new Error('TODO');
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
