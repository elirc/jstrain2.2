// ─────────────────────────────────────────────────────────────────────────
//  31 · two-level grouping                                 ★★☆ core
//  concepts: reduce · nested accumulators · ??=
//  run: node 31-nested-grouping.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every reporting screen eventually asks for a tree: loans by branch, and
//  inside each branch by genre. Build the two-level version of `groupBy`,
//  then the tally-only version of the same walk.
//
//      groupByTwo(LOANS, l => l.branch, l => l.genre)
//        → { north: { scifi: [l1, l4], history: [l2] }, south: { … } }
//      countByTwo(LOANS, l => l.branch, l => l.genre)
//        → { north: { scifi: 2, history: 1 }, south: { … } }
//
//  Build plain `{}` objects: `Object.groupBy` hands back a null-prototype
//  object, which is not deep-equal to a plain one.
//
//  hint: `tree[outer] ??= {}` before you touch the inner level — and the
//  inner bucket needs the same treatment before you push.

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
  throw new Error('TODO');
}

export function countByTwo(items, outerOf, innerOf) {
  throw new Error('TODO');
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
