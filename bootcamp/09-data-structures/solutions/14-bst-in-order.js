// ─────────────────────────────────────────────────────────────────────────
//  14 · binary search tree: in-order traversal — SOLUTION     ★★☆ core
//  run: node 14-bst-in-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: left → self → right. The BST invariant says everything on
//  the left is smaller and everything on the right is bigger, so visiting
//  in that order produces sorted output by construction. Swap the three
//  lines around and you get the other classic walks: self-left-right is
//  pre-order (used to copy or serialise a tree), left-right-self is
//  post-order (used to delete children before their parent).
//  O(n) time — every node is visited once — and O(height) stack space.
//  The null check at the top of the helper is the base case; without it
//  the recursion runs off the end of the tree.
//  Reading a BST in order is how "give me everything between X and Y"
//  works in a database index: the tree finds the start in O(log n), then
//  the in-order walk streams the rest already sorted.

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
    const out = [];
    const visit = (node) => {
      if (node === null) return;
      visit(node.left);
      out.push(node.value);
      visit(node.right);
    };
    visit(this.root);
    return out;
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
