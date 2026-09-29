// ─────────────────────────────────────────────────────────────────────────
//  30 · validate a BST                                      ★★☆ core
//  concepts: BST invariant · min/max bounds · recursion
//  run: node 30-bst-validate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A binary search tree only earns its O(log n) lookup if the invariant
//  actually holds: EVERY value in a node's left subtree is smaller than
//  it, and every value on the right is larger. Not just its children —
//  every descendant. Equal values are not allowed.
//
//      isValidBST(validTree)   → true
//      isValidBST(trapTree)    → false
//      isValidBST(null)        → true      (an empty tree is fine)
//
//  The trap tree below passes the lazy check: 3 < 5 < 12 and 5 < 10 < 15,
//  every parent/child pair looks correct. But 12 lives to the LEFT of 10,
//  so a search for 12 walks right at the root and never finds it.
//
//  hint: carry a (low, high) window down the tree — going left tightens
//  the high bound, going right tightens the low one

import { test, eq } from '../../_lib/check.js';

const node = (value, left = null, right = null) => ({ value, left, right });

//        10           a well-formed index
//       /  \
//      5    15
//     / \     \
//    3   7     20
const validTree = node(
  10,
  node(5, node(3), node(7)),
  node(15, null, node(20))
);

//        10           12 is bigger than 10 but sits on the LEFT
//       /  \
//      5    15
//     / \
//    3   12
const trapTree = node(10, node(5, node(3), node(12)), node(15));

export function isValidBST(root) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a well-formed index is valid', () => {
  eq(isValidBST(validTree), true);
});

test('an empty tree and a lone node are valid', () => {
  eq(isValidBST(null), true);
  eq(isValidBST(node(42)), true);
});

test('the grandchild trap is caught', () => {
  eq(isValidBST(trapTree), false, '12 is unreachable by a search');
});

test('a swapped child is caught on either side', () => {
  eq(isValidBST(node(10, node(15), node(20))), false);
  eq(isValidBST(node(10, node(5), node(2))), false);
});

test('duplicate values are not allowed', () => {
  eq(isValidBST(node(10, node(10), null)), false);
  eq(isValidBST(node(10, null, node(10))), false);
});

test('a degenerate chain is still a valid BST', () => {
  const chain = node(1, null, node(2, null, node(3, null, node(4))));
  eq(isValidBST(chain), true, 'valid, just slow — see exercise 15');
});

test('application: a rebuilt search index is verified before serving', () => {
  const snapshot = node(
    50,
    node(25, node(10), node(40)),
    node(75, node(60), node(90))
  );
  eq(isValidBST(snapshot), true, 'safe to answer queries from');

  const corrupted = node(
    50,
    node(25, node(10), node(80)),
    node(75, node(60), node(90))
  );
  eq(isValidBST(corrupted), false, 'reject it, do not serve wrong misses');
});
