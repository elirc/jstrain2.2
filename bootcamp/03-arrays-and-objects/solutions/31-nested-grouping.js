// ─────────────────────────────────────────────────────────────────────────
//  31 · two-level grouping — SOLUTION                      ★★☆ core
//  run: node 31-nested-grouping.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: nesting does not change the shape of the fold, it only adds
//  one more "make the container if it is missing" step. `??=` is the tidy
//  way to say that; the older `tree[a] = tree[a] || {}` is the same idea and
//  the older-still `if (!tree[a]) tree[a] = {}` reads fine too. The classic
//  wrong turn is reaching for `Object.groupBy` twice — it works, but every
//  level comes back with a null prototype, so the result is not deep-equal
//  to the `{ north: { … } }` literal your test writes and `tree.north.scifi`
//  survives while `tree.hasOwnProperty` does not. Keep the buckets holding
//  the ORIGINAL items: grouping is a view, not a copy, and callers expect
//  `tree.north.scifi[0] === loans[0]`.

import { test, eq, ok } from '../../_lib/check.js';

const LOANS = Object.freeze([
  Object.freeze({ id: 'l1', branch: 'north', genre: 'scifi',   days: 14 }),
  Object.freeze({ id: 'l2', branch: 'north', genre: 'history', days: 7 }),
  Object.freeze({ id: 'l3', branch: 'south', genre: 'scifi',   days: 21 }),
  Object.freeze({ id: 'l4', branch: 'north', genre: 'scifi',   days: 3 }),
  Object.freeze({ id: 'l5', branch: 'south', genre: 'poetry',  days: 9 }),
  Object.freeze({ id: 'l6', branch: 'south', genre: 'scifi',   days: 5 }),
]);

export function groupByTwo(items, outerOf, innerOf) {
  return items.reduce((tree, item) => {
    const outer = outerOf(item);
    const inner = innerOf(item);
    tree[outer] ??= {};
    tree[outer][inner] ??= [];
    tree[outer][inner].push(item);
    return tree;
  }, {});
}

export function countByTwo(items, outerOf, innerOf) {
  return items.reduce((tree, item) => {
    const outer = outerOf(item);
    const inner = innerOf(item);
    tree[outer] ??= {};
    tree[outer][inner] = (tree[outer][inner] ?? 0) + 1;
    return tree;
  }, {});
}

// ──────────────────────────── tests ──────────────────────────────────────

const branchOf = (l) => l.branch;
const genreOf = (l) => l.genre;

test('the outer level is one key per branch, in first-seen order', () => {
  const tree = groupByTwo(LOANS, branchOf, genreOf);
  eq(Object.keys(tree), ['north', 'south']);
});

test('the inner level buckets by genre', () => {
  const tree = groupByTwo(LOANS, branchOf, genreOf);
  eq(Object.keys(tree.south), ['scifi', 'poetry']);
});

test('items keep their source order inside a bucket', () => {
  const tree = groupByTwo(LOANS, branchOf, genreOf);
  eq(tree.north.scifi.map((l) => l.id), ['l1', 'l4']);
  eq(tree.south.scifi.map((l) => l.id), ['l3', 'l6']);
});

test('a genre only one branch has stays in that branch', () => {
  const tree = groupByTwo(LOANS, branchOf, genreOf);
  eq(tree.north.poetry, undefined);
  eq(tree.south.poetry.length, 1);
});

test('the buckets hold the original items, not copies', () => {
  const tree = groupByTwo(LOANS, branchOf, genreOf);
  ok(tree.north.history[0] === LOANS[1]);
});

test('the result is a plain object, deep-equal to a literal', () => {
  const tree = groupByTwo(LOANS.slice(0, 2), branchOf, genreOf);
  eq(tree, { north: { scifi: [LOANS[0]], history: [LOANS[1]] } });
});

test('countByTwo tallies instead of collecting', () => {
  eq(countByTwo(LOANS, branchOf, genreOf), {
    north: { scifi: 2, history: 1 },
    south: { scifi: 2, poetry: 1 },
  });
});

test('an empty list groups into an empty object', () => {
  eq(groupByTwo([], branchOf, genreOf), {});
  eq(countByTwo([], branchOf, genreOf), {});
});
