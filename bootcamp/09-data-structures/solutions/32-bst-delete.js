// ─────────────────────────────────────────────────────────────────────────
//  32 · delete a node from a BST — SOLUTION                 ★★★ stretch
//  run: node 32-bst-delete.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: descend to the node exactly as a search would — O(h), so
//  log n on a balanced tree and n on a degenerate one — then patch the
//  hole. A leaf or a one-child node is easy: return null or return the
//  single child, and the caller's `root.left = remove(...)` reattaches it.
//  Two children is the interesting case. The replacement has to be a value
//  that is bigger than everything on the left and smaller than everything
//  on the right, and only two values qualify: the in-order successor (the
//  minimum of the right subtree) or the predecessor (the maximum of the
//  left). Copy the successor's value up, then delete the successor from
//  the right subtree — and that recursive call always hits the easy case,
//  because a minimum has no left child by definition.
//  Why not "delete by marking the node dead"? Tombstones make every later
//  traversal pay for data that is gone, and a rebuilt-from-scratch tree is
//  O(n log n) for one removal.
//  Classic wrong turns: copying the successor's value but leaving its
//  original node in place (now the value appears twice), and forgetting to
//  RETURN root from the recursive branches — the rebuilt subtree is then
//  never reattached and half the tree vanishes.

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
  if (root === null) return null;

  if (value < root.value) {
    root.left = remove(root.left, value);
  } else if (value > root.value) {
    root.right = remove(root.right, value);
  } else if (root.left === null) {
    return root.right; // covers the leaf case too (both null)
  } else if (root.right === null) {
    return root.left;
  } else {
    let successor = root.right;
    while (successor.left !== null) successor = successor.left;
    root.value = successor.value;
    root.right = remove(root.right, successor.value);
  }
  return root;
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
