// ─────────────────────────────────────────────────────────────────────────
//  29 · named function expressions — SOLUTION              ★★☆ core
//  run: node 29-named-function-expressions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: naming a function expression binds that name inside the
//  function's own scope only. Recursing through it is immune to everything
//  that happens outside: `const g = fact; fact = null; g(4)` still works,
//  a detached method still works, and a renamed import still works.
//  The three wrong turns this drills: recursing through the outer variable
//  (dies when the variable is reassigned), recursing through the object
//  (`tree.countLeaves(child)` — dies when the method is detached or the
//  property is overwritten), and `this.countLeaves(child)` (dies the moment
//  the method is passed as a callback and loses its receiver).
//  Bonus: the name also shows up in stack traces and in `fn.name`, which
//  is why an anonymous arrow chain is harder to debug.

import { test, eq, ok } from '../../_lib/check.js';

export const sumTo = function total(n) {
  return n <= 0 ? 0 : n + total(n - 1);
};

export const tree = {
  countLeaves: function walk(node) {
    if (node.children.length === 0) return 1;
    return node.children.reduce((n, child) => n + walk(child), 0);
  },
};

// ── given: a node with an empty `children` array is a leaf ──
const oak = {
  name: 'root',
  children: [
    { name: 'a', children: [] },
    { name: 'b', children: [{ name: 'c', children: [] }] },
  ],
};

// ──────────────────────────── tests ──────────────────────────────────────

test('sumTo adds up the whole numbers up to n', () => {
  eq(sumTo(4), 10);
  eq(sumTo(1), 1);
});

test('sumTo bottoms out at zero', () => {
  eq(sumTo(0), 0);
});

test('sumTo recurses through its own name, which stays private', () => {
  eq(sumTo(3), 6);
  eq(sumTo.name, 'total', 'the expression must be named `total`');
  eq(typeof globalThis.total, 'undefined', '`total` must not leak out');
});

test('countLeaves counts the leaves of a nested tree', () => {
  eq(tree.countLeaves(oak), 2);
});

test('a childless node is itself one leaf', () => {
  eq(tree.countLeaves({ name: 'solo', children: [] }), 1);
});

test('the method survives being detached from the object', () => {
  const detached = tree.countLeaves;
  const original = tree.countLeaves;
  tree.countLeaves = null;
  try {
    eq(detached(oak), 2, 'recursion must not go through `tree` or `this`');
  } finally {
    tree.countLeaves = original;
  }
});

test('the method carries its own name, not the property name', () => {
  eq(tree.countLeaves(oak), 2);
  eq(tree.countLeaves.name, 'walk', 'the expression must be named `walk`');
});
