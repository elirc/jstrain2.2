// ─────────────────────────────────────────────────────────────────────────
//  30 · validate a BST — SOLUTION                           ★★☆ core
//  run: node 30-bst-validate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every node inherits a legal range from the path taken to
//  reach it. The root may be anything, (-Infinity, Infinity). Step left
//  and the high bound becomes the parent's value; step right and the low
//  bound does. A node is valid when it sits strictly inside its window and
//  both subtrees are valid inside their narrowed ones.
//  Each node is visited once, so O(n) time with O(h) stack — h being the
//  height, log n on a balanced tree and n on a chain.
//  Why care: an invalid BST does not run slowly, it LIES. Every lookup is
//  still O(log n) and still confidently returns "not found" for a value
//  sitting three nodes away. That is why you validate a tree you did not
//  build yourself — after a restore, a merge, or a hand-edited fixture.
//  Classic wrong turn: checking only node.left.value < node.value <
//  node.right.value. That passes the trap tree, where 12 is a legal child
//  of 5 but an illegal descendant of 10. The bound has to travel down from
//  the ANCESTORS, not just from the parent.
//  (An in-order traversal that checks the values come out strictly
//  increasing is the same idea wearing a different hat.)

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

const within = (current, low, high) => {
  if (current === null) return true;
  if (current.value <= low || current.value >= high) return false;
  return (
    within(current.left, low, current.value) &&
    within(current.right, current.value, high)
  );
};

export function isValidBST(root) {
  return within(root, -Infinity, Infinity);
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
