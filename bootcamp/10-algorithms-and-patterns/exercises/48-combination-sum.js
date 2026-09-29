// ─────────────────────────────────────────────────────────────────────────
//  48 · combinationSum                                      ★★☆ core
//  concepts: pattern: backtracking with reuse · start index prunes dupes
//  run: node 48-combination-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every way to hit `target` by adding up candidates. Each candidate may
//  be used as many times as you like, and two combinations that differ
//  only in ORDER are the same combination.
//
//      combinationSum([2, 3, 6, 7], 7)  → [[2, 2, 3], [7]]
//      combinationSum([2, 3], 6)        → [[2, 2, 2], [3, 3]]
//      combinationSum([2], 1)           → []
//
//  The outer order does not matter; the tests compare order-insensitively.
//  A target of 0 has exactly one combination: the empty one.
//
//  hint: recurse with a START index, and pass the SAME index down when
//        you reuse a candidate — that is what stops [2,3] and [3,2] both
//        appearing

import { test, eq, ok } from '../../_lib/check.js';

export function combinationSum(candidates, target) {
  throw new Error('TODO');
}

// helper for the tests: compare combinations regardless of their order
const canon = (lists) =>
  lists.map((list) => [...list].sort().join(',')).sort();

// ──────────────────────────── tests ──────────────────────────────────────

test('finds both ways to make 7', () => {
  eq(canon(combinationSum([2, 3, 6, 7], 7)), canon([[2, 2, 3], [7]]));
});

test('reuses a candidate as often as needed', () => {
  eq(canon(combinationSum([2], 4)), canon([[2, 2]]));
});

test('never reports the same combination twice', () => {
  eq(canon(combinationSum([2, 3], 6)), canon([[2, 2, 2], [3, 3]]));
});

test('finds three combinations for 8', () => {
  eq(
    canon(combinationSum([2, 3, 5], 8)),
    canon([[2, 2, 2, 2], [2, 3, 3], [3, 5]])
  );
});

test('returns nothing when the target cannot be made', () => {
  eq(combinationSum([2], 1), []);
  eq(combinationSum([], 5), []);
});

test('a target of 0 has one empty combination', () => {
  eq(combinationSum([2, 3], 0), [[]]);
});

test('each combination is its own array', () => {
  const out = combinationSum([2, 3, 6, 7], 7);
  ok(out.length === 2, 'expected two combinations');
  ok(out[0] !== out[1], 'combinations must not share one array reference');
});
