// ─────────────────────────────────────────────────────────────────────────
//  13 · binary search tree: insert and contains               ★★☆ core
//  concepts: trees · recursion · ordered data
//  run: node 13-bst-insert.js
// ─────────────────────────────────────────────────────────────────────────
//
//  One rule holds a BST together: everything in a node's LEFT subtree is
//  smaller than the node, everything in its RIGHT subtree is bigger. That
//  rule is what lets a lookup throw away half the remaining tree at every
//  step instead of scanning like an array does.
//
//      const tree = new BST();
//      for (const n of [8, 3, 10]) tree.insert(n);
//
//              8            tree.root.value        → 8
//             / \           tree.root.left.value   → 3
//            3   10         tree.root.right.value  → 10
//
//      tree.contains(10)  → true
//      tree.contains(7)   → false
//      tree.insert(8)     → duplicate, tree unchanged
//
//  Nodes are { value, left, right } with null for a missing child.
//  insert() returns the tree.
//
//  hint: both methods are the same walk — compare, then go left or right
//  until you fall off the tree

import { test, eq, ok } from '../../_lib/check.js';

export class BST {
  constructor() {
    this.root = null;
  }

  insert(value) {
    throw new Error('TODO');
  }

  contains(value) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the first insert becomes the root', () => {
  const tree = new BST();
  tree.insert(8);
  eq(tree.root.value, 8);
  ok(tree.root.left === null && tree.root.right === null);
});

test('smaller values go left and bigger values go right', () => {
  const tree = new BST();
  for (const n of [8, 3, 10]) tree.insert(n);
  eq(tree.root.left.value, 3);
  eq(tree.root.right.value, 10);
});

test('inserts keep descending until they find an empty slot', () => {
  const tree = new BST();
  for (const n of [8, 3, 10, 1, 6]) tree.insert(n);
  eq(tree.root.left.left.value, 1);
  eq(tree.root.left.right.value, 6);
});

test('contains finds values at every depth', () => {
  const tree = new BST();
  for (const n of [8, 3, 10, 1, 6, 14]) tree.insert(n);
  eq(tree.contains(8), true);
  eq(tree.contains(6), true);
  eq(tree.contains(14), true);
});

test('contains is false for a value that was never inserted', () => {
  const tree = new BST();
  for (const n of [8, 3, 10]) tree.insert(n);
  eq(tree.contains(7), false);
  eq(tree.contains(100), false);
});

test('contains on an empty tree is false', () => {
  const tree = new BST();
  eq(tree.contains(1), false);
});

test('duplicate inserts are ignored', () => {
  const tree = new BST();
  tree.insert(5);
  tree.insert(5);
  ok(tree.root.left === null && tree.root.right === null);
});

test('application: a spell-check dictionary of words', () => {
  const dictionary = new BST();
  for (const word of ['melon', 'apple', 'pear', 'cherry', 'zucchini']) {
    dictionary.insert(word);
  }
  eq(dictionary.contains('cherry'), true);
  eq(dictionary.contains('durian'), false);
  eq(dictionary.root.value, 'melon');
  eq(dictionary.root.left.value, 'apple');
});
