// ─────────────────────────────────────────────────────────────────────────
//  32 · delete a node from a BST                            ★★★ stretch
//  concepts: BST surgery · in-order successor · three cases
//  run: node 32-bst-delete.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Inserting into a BST is easy; deleting is the one that separates people
//  who have drawn the tree from people who have not. Three cases:
//
//    · a leaf          → unhook it
//    · one child       → promote that child into its place
//    · two children    → overwrite the value with the IN-ORDER SUCCESSOR
//                        (the smallest value in the right subtree), then
//                        delete that successor from the right subtree
//
//      remove(sample(), 5)     → 5 is gone, everything else in order
//      remove(sample(), 10)    → 15 takes its place
//      remove(sample(), 999)   → unchanged
//
//  Return the (possibly new) root — removing the last node returns null.
//  Edit in place — a value that is not there returns the same root.
//
//  hint: recursion here has to REATTACH what it rebuilds:
//  root.left = remove(root.left, value), and return root at the end

import { test, eq, ok } from '../../_lib/check.js';

const insert = (root, value) => {
  if (root === null) return { value, left: null, right: null };
  if (value < root.value) root.left = insert(root.left, value);
  else if (value > root.value) root.right = insert(root.right, value);
  return root;
};

const treeOf = (...values) => values.reduce((root, v) => insert(root, v), null);

const inOrder = (root) =>
  root === null ? [] : [...inOrder(root.left), root.value, ...inOrder(root.right)];

const contains = (root, value) => {
  let node = root;
  while (node !== null) {
    if (value === node.value) return true;
    node = value < node.value ? node.left : node.right;
  }
  return false;
};

//         20
//        /  \
//      10    30
//     / \   /  \
//    5  15 25  35
const sample = () => treeOf(20, 10, 30, 5, 15, 25, 35);

export function remove(root, value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('removing a leaf just unhooks it', () => {
  const tree = remove(sample(), 5);
  eq(inOrder(tree), [10, 15, 20, 25, 30, 35]);
  eq(tree.left.left, null, 'the 10 lost its left child');
});

test('a node with one child is replaced by that child', () => {
  const left = remove(treeOf(20, 10, 5), 10);
  eq(left.left.value, 5, 'the only child moved up');
  eq(inOrder(left), [5, 20]);

  const right = remove(treeOf(20, 10, 15), 10);
  eq(right.left.value, 15, 'promotion works on the other side too');
});

test('a node with two children takes its in-order successor', () => {
  const tree = remove(sample(), 10);
  eq(inOrder(tree), [5, 15, 20, 25, 30, 35]);
  eq(tree.left.value, 15, 'the smallest value on its right moved up');
  eq(tree.left.right, null, 'and its old node is gone, not duplicated');
});

test('removing the root keeps the tree sorted and searchable', () => {
  const tree = remove(sample(), 20);
  eq(tree.value, 25);
  eq(inOrder(tree), [5, 10, 15, 25, 30, 35]);
  eq(contains(tree, 35), true, 'still reachable by descent');
});

test('removing a value that is not there changes nothing', () => {
  const before = sample();
  const after = remove(before, 999);
  ok(after === before, 'same tree object');
  eq(inOrder(after), [5, 10, 15, 20, 25, 30, 35]);
  eq(remove(null, 1), null);
});

test('removing every value ends at an empty tree', () => {
  let tree = sample();
  for (const value of [20, 5, 35, 10, 25, 15, 30]) {
    tree = remove(tree, value);
  }
  eq(tree, null);
});

test('application: unsubscribing users leaves the index searchable', () => {
  let index = treeOf(500, 250, 750, 100, 400, 600, 900);
  index = remove(index, 250);
  index = remove(index, 900);
  eq(inOrder(index), [100, 400, 500, 600, 750]);
  eq(contains(index, 250), false, 'gone');
  eq(contains(index, 400), true, 'and the rest still found in O(h)');
});
