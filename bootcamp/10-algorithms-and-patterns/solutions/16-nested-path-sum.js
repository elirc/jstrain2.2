// ─────────────────────────────────────────────────────────────────────────
//  16 · hasPathSum — SOLUTION                               ★★☆ core
//  concepts: pattern: recursion over a nested structure (DFS) · leaves
//  run: node 16-nested-path-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: depth-first recursion on a nested structure,
//  carrying a "budget" down instead of a running total up. Subtract the
//  node's value from the target; at a leaf, the question is simply "is
//  the remaining budget 0?". At an internal node, the answer is `some()`
//  over the children with the reduced target.
//  Three cases, always in this order: no node → false; leaf → compare;
//  otherwise → recurse. Time O(n), space O(depth) for the call stack.
//  The naive version collects every root-to-leaf path into arrays and
//  sums them afterwards — same O(n) work but O(n · depth) memory and a
//  lot more code. Carrying the remainder is the trick worth keeping.
//  Bite: an internal node whose values happen to hit the target is NOT a
//  match (target 9 here). Check "is a leaf" before comparing, and never
//  treat "target reached" as a reason to stop descending — negative
//  values below can undo it.

import { test, eq } from '../../_lib/check.js';

// the tree used by the tests
//        5
//      /   \
//     4     8
//     |    /  \
//    11  13   -2
const tree = {
  value: 5,
  children: [
    { value: 4, children: [{ value: 11, children: [] }] },
    {
      value: 8,
      children: [
        { value: 13, children: [] },
        { value: -2, children: [] },
      ],
    },
  ],
};

export function hasPathSum(node, target) {
  if (!node) return false;
  const remaining = target - node.value;
  if (node.children.length === 0) return remaining === 0;
  return node.children.some((child) => hasPathSum(child, remaining));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds a path down the left branch', () => {
  eq(hasPathSum(tree, 20), true);
});

test('finds a path down the right branch', () => {
  eq(hasPathSum(tree, 26), true);
});

test('a path must end at a leaf, not part way down', () => {
  eq(hasPathSum(tree, 9), false);
});

test('returns false when no path adds up', () => {
  eq(hasPathSum(tree, 21), false);
});

test('handles negative values along the path', () => {
  eq(hasPathSum(tree, 11), true);
});

test('a missing node is not a path', () => {
  eq(hasPathSum(null, 0), false);
  eq(hasPathSum(undefined, 5), false);
});

test('handles a single-node tree', () => {
  const leaf = { value: 7, children: [] };
  eq(hasPathSum(leaf, 7), true);
  eq(hasPathSum(leaf, 0), false);
});
