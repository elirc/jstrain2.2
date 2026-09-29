// ─────────────────────────────────────────────────────────────────────────
//  13 · binary search tree: insert and contains — SOLUTION    ★★☆ core
//  run: node 13-bst-insert.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both operations are one loop — compare with the current
//  node, step left or right, stop when you hit null. Written iteratively
//  there is no recursion to blow the stack on a deep tree.
//  Why a tree instead of an array? A sorted array can binary-search in
//  O(log n) too, but inserting into it is O(n) because everything after
//  the insertion point slides. A BST gives O(log n) for BOTH — as long as
//  it stays roughly balanced. Insert already-sorted data and every node
//  goes right, the tree becomes a linked list and lookups fall to O(n).
//  That is the whole reason red-black and AVL trees exist (exercise 15
//  measures the damage).
//  Duplicates: this version drops them, which makes the tree a SET.
//  Alternatives are a count per node or always going right — pick one on
//  purpose, because "whatever falls out" tends to mean a lost row.

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
      if (value === node.value) return this; // duplicate: ignore
      const side = value < node.value ? 'left' : 'right';
      if (node[side] === null) {
        node[side] = makeNode(value);
        return this;
      }
      node = node[side];
    }
  }

  contains(value) {
    let node = this.root;
    while (node !== null) {
      if (value === node.value) return true;
      node = value < node.value ? node.left : node.right;
    }
    return false;
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
