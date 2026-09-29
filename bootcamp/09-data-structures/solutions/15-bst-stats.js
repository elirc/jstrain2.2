// ─────────────────────────────────────────────────────────────────────────
//  15 · binary search tree: min, max and height — SOLUTION    ★★☆ core
//  run: node 15-bst-stats.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: min and max exploit the invariant instead of searching —
//  the smallest value cannot be anywhere except the leftmost node, so it
//  is one loop with no comparisons, O(height). height() is the natural
//  recursion: an empty spot is 0 levels, any other node is 1 + the taller
//  side.
//  The last two tests are the point of the exercise. Height IS the cost of
//  a lookup: a balanced tree of 15 nodes is 4 levels deep (~log2 n), while
//  the same 15 values inserted in sorted order build a 15-level chain and
//  every "O(log n)" operation quietly becomes O(n). Feeding a plain BST
//  data that arrives sorted — ids, timestamps, autoincrement keys — is the
//  classic way to build an index that is slower than the array it replaced.
//  Self-balancing trees (AVL, red-black) rotate on insert to keep height
//  at O(log n); that is the only difference that matters here.

import { test, eq, ok } from '../../_lib/check.js';

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

  min() {
    if (this.root === null) return undefined;
    let node = this.root;
    while (node.left !== null) node = node.left;
    return node.value;
  }

  max() {
    if (this.root === null) return undefined;
    let node = this.root;
    while (node.right !== null) node = node.right;
    return node.value;
  }

  height() {
    const measure = (node) => {
      if (node === null) return 0;
      return 1 + Math.max(measure(node.left), measure(node.right));
    };
    return measure(this.root);
  }
}

const treeOf = (...values) => {
  const tree = new BST();
  for (const value of values) tree.insert(value);
  return tree;
};

// ──────────────────────────── tests ──────────────────────────────────────

test('min is the leftmost value and max is the rightmost', () => {
  const tree = treeOf(8, 3, 10, 1, 6, 14);
  eq(tree.min(), 1);
  eq(tree.max(), 14);
});

test('min and max of an empty tree are undefined', () => {
  const tree = new BST();
  eq(tree.min(), undefined);
  eq(tree.max(), undefined);
});

test('a single node is its own min and max, one level tall', () => {
  const tree = treeOf(7);
  eq(tree.min(), 7);
  eq(tree.max(), 7);
  eq(tree.height(), 1);
});

test('an empty tree has height 0', () => {
  eq(new BST().height(), 0);
});

test('height counts the levels of a balanced tree', () => {
  eq(treeOf(4, 2, 6, 1, 3, 5, 7).height(), 3);
});

test('height follows the longest path, not the shortest', () => {
  eq(treeOf(5, 3, 4, 8).height(), 3);
});

test('sorted inserts degrade the tree into a linked list', () => {
  const tree = treeOf(1, 2, 3, 4, 5);
  eq(tree.height(), 5, 'every insert went right');
  eq(tree.min(), 1);
  eq(tree.max(), 5);
});

test('application: shuffled ids index far better than sorted ones', () => {
  const sortedIds = Array.from({ length: 15 }, (_, i) => i + 1);
  const shuffled = [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15];
  const bad = treeOf(...sortedIds);
  const good = treeOf(...shuffled);
  eq(bad.height(), 15, 'a sorted feed builds a list, so lookups are O(n)');
  eq(good.height(), 4, 'balanced: lookups cost about log2(15) steps');
  ok(good.height() < bad.height());
});
