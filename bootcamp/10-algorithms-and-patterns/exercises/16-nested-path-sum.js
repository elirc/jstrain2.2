// ─────────────────────────────────────────────────────────────────────────
//  16 · hasPathSum                                          ★★☆ core
//  concepts: pattern: recursion over a nested structure (DFS) · leaves
//  run: node 16-nested-path-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A node is `{ value: number, children: node[] }`. A LEAF is a node with
//  an empty children array. Is there a root-to-leaf path whose values add
//  up exactly to the target?
//
//      hasPathSum(tree, 20)  → true    (5 → 4 → 11)
//      hasPathSum(tree, 9)   → false   (5 → 4 adds to 9, but 4 is not a
//                                       leaf, so that is not a path)
//      hasPathSum(null, 0)   → false
//
//  This is the shape of every tree problem: handle the empty case, handle
//  the leaf case, otherwise ask the same question of each child with a
//  smaller target.
//
//  hint: subtract the current value from the target as you go down

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
  throw new Error('TODO');
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
