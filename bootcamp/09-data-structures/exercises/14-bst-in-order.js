// ─────────────────────────────────────────────────────────────────────────
//  14 · binary search tree: in-order traversal                ★★☆ core
//  concepts: recursion · traversal order · sortedness
//  run: node 14-bst-in-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A BST is already sorted — you just have to read it in the right order.
//  Visit the whole LEFT subtree, then the node, then the RIGHT subtree,
//  and the values come out ascending. No call to .sort() anywhere.
//
//      insert 8, 3, 10, 1, 6, 14
//
//              8
//             / \
//            3   10          inOrder()  → [1, 3, 6, 8, 10, 14]
//           / \    \
//          1   6    14
//
//      new BST().inOrder()   → []
//
//  `insert` is already written. Return a plain array of values.
//
//  hint: a recursive helper that takes a node and pushes into a shared
//  array is the shortest route — the order of the three lines is the
//  entire algorithm

import { test, eq } from '../../_lib/check.js';

const makeNode = (value) => ({ value, left: null, right: null });

export class BST {
  constructor() {
    this.root = null;
  }

  insert(value) {
    if (this.root === null) {
      this.root = makeNode(value);
      return this;
    }
    let node = this.root;
    for (;;) {
      if (value === node.value) return this;
      const side = value < node.value ? 'left' : 'right';
      if (node[side] === null) {
        node[side] = makeNode(value);
        return this;
      }
      node = node[side];
    }
  }

  inOrder() {
    throw new Error('TODO');
  }
}

const treeOf = (...values) => {
  const tree = new BST();
  for (const value of values) tree.insert(value);
  return tree;
};

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the values in ascending order', () => {
  eq(treeOf(8, 3, 10, 1, 6, 14).inOrder(), [1, 3, 6, 8, 10, 14]);
});

test('the insert order does not change the output', () => {
  const a = treeOf(5, 2, 9, 1, 7).inOrder();
  const b = treeOf(9, 7, 5, 2, 1).inOrder();
  eq(a, b);
  eq(a, [1, 2, 5, 7, 9]);
});

test('an empty tree traverses to an empty array', () => {
  eq(new BST().inOrder(), []);
});

test('a single node traverses to one value', () => {
  eq(treeOf(42).inOrder(), [42]);
});

test('handles negative numbers and a lopsided tree', () => {
  eq(treeOf(0, -5, -10, -1).inOrder(), [-10, -5, -1, 0]);
});

test('sorts strings by the same walk', () => {
  eq(treeOf('pear', 'apple', 'melon').inOrder(), ['apple', 'melon', 'pear']);
});

test('application: a leaderboard reads back sorted, no sort() needed', () => {
  const scores = treeOf(120, 340, 90, 500, 210);
  const ranking = scores.inOrder();
  eq(ranking, [90, 120, 210, 340, 500]);
  eq(ranking.at(-1), 500, 'the top score is the last value');
});
