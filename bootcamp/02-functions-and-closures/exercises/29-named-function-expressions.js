// ─────────────────────────────────────────────────────────────────────────
//  29 · named function expressions                         ★★☆ core
//  concepts: function expressions · recursion · scope
//  run: node 29-named-function-expressions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A function expression may carry a name, and that name is visible ONLY
//  inside the function's own body. It is a private handle the function has
//  on itself — nobody outside can see it, reassign it, or take it away.
//
//      const fact = function f(n) { return n < 2 ? 1 : n * f(n - 1); };
//      fact(4)   → 24
//      f         → ReferenceError: f is not defined
//
//  Write both of these as NAMED function expressions and recurse through
//  the inner name — never through `sumTo`, `tree.countLeaves` or `this`:
//
//      sumTo(4)              → 10     name the expression `total`
//      tree.countLeaves(oak) → 2      name the expression `walk`
//
//  `countLeaves(node)` returns 1 for a node with no children, otherwise the
//  sum over its children. The payoff shows up in the last test: the method
//  is pulled off the object and the property is wiped, and it still works.
//
//  hint: `function walk(node) { ... walk(child) ... }` written where a
//  value is expected — the name never reaches the surrounding scope

import { test, eq, ok } from '../../_lib/check.js';

export const sumTo = function (n) {
  throw new Error('TODO');
};

export const tree = {
  countLeaves: function (node) {
    throw new Error('TODO');
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
