// ─────────────────────────────────────────────────────────────────────────
//  18 · inOrder · kthSmallest                                  ★★☆ core
//  concepts: recursive generators · yield* · lazy tree walks
//  run: node 18-bst-in-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A binary search tree keeps everything smaller on the left and
//  everything bigger on the right, so walking it left-node-right hands
//  you the values in sorted order. Write that walk as a generator and
//  you get the sort for free AND you get to stop halfway.
//
//      node = { value, left, right }        null means "no child"
//
//      [...inOrder(TREE)]     → [1, 3, 4, 6, 7, 8, 10, 13, 14]
//      [...inOrder(null)]     → []
//      kthSmallest(TREE, 4)   → 6           1-based, undefined past end
//
//  kthSmallest must not walk the whole tree: build it on top of
//  inOrder and leave as soon as you have the answer.
//
//  hint: `yield* inOrder(node.left)` — the star hands out every value
//        the recursive call produces before your own `yield` runs

import { test, eq, ok } from '../../_lib/check.js';

// scaffolding: a BST built from plain objects, take() from earlier, and
// a wrapper that counts how many node values were actually read.
// Do not edit.
const node = (value, left = null, right = null) => ({ value, left, right });

const TREE = node(
  8,
  node(3, node(1), node(6, node(4), node(7))),
  node(10, null, node(14, node(13), null))
);

function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function counted(root) {
  const log = { reads: 0 };
  const wrap = (n) =>
    n === null
      ? null
      : {
          get value() {
            log.reads += 1;
            return n.value;
          },
          get left() {
            return wrap(n.left);
          },
          get right() {
            return wrap(n.right);
          },
        };
  return { tree: wrap(root), log };
}

export function* inOrder(root) {
  throw new Error('TODO');
}

export function kthSmallest(root, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an in-order walk comes out sorted', () => {
  eq([...inOrder(TREE)], [1, 3, 4, 6, 7, 8, 10, 13, 14]);
});

test('an empty tree yields nothing', () => {
  eq([...inOrder(null)], []);
});

test('a single node yields its own value', () => {
  eq([...inOrder(node(42))], [42]);
});

test('a right-leaning chain is still sorted', () => {
  eq([...inOrder(node(1, null, node(2, null, node(3))))], [1, 2, 3]);
});

test('the walk is lazy — two values cost two node reads', () => {
  const { tree, log } = counted(TREE);
  eq([...take(2, inOrder(tree))], [1, 3]);
  ok(log.reads <= 3, `read ${log.reads} node values to produce 2`);
});

test('kthSmallest counts from one', () => {
  eq(kthSmallest(TREE, 1), 1);
  eq(kthSmallest(TREE, 4), 6);
  eq(kthSmallest(TREE, 9), 14);
});

test('kthSmallest past the end is undefined', () => {
  eq(kthSmallest(TREE, 99), undefined);
  eq(kthSmallest(null, 1), undefined);
});

test('kthSmallest stops as soon as it has the answer', () => {
  const { tree, log } = counted(TREE);
  eq(kthSmallest(tree, 2), 3);
  ok(log.reads <= 3, `read ${log.reads} node values to find the 2nd`);
});
