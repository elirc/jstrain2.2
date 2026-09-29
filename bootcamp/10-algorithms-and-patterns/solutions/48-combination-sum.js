// ─────────────────────────────────────────────────────────────────────────
//  48 · combinationSum — SOLUTION                           ★★☆ core
//  concepts: pattern: backtracking with reuse · start index prunes dupes
//  run: node 48-combination-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: backtracking (choose → explore → un-choose),
//  with a start index for de-duplication and a running remainder.
//  Smell: "list every combination that satisfies X" — enumerate, not
//  count. If the question only wanted HOW MANY, this would be a DP table.
//  Track what is left instead of what has been used: recurse on
//  remaining - candidate. Hitting 0 exactly is a hit; going below 0 is a
//  dead branch, pruned immediately.
//  The start index does two jobs. Passing `index` (not index + 1) lets a
//  candidate repeat; never looking BACKWARD means each combination is
//  generated in one fixed order only, so [2,3] and [3,2] cannot both
//  appear. That beats the naive "generate everything, then dedupe with a
//  Set of sorted strings".
//  Time is exponential in target / smallest candidate — that is inherent,
//  you are printing every answer. Space O(target) for the recursion depth.
//  Bites: push a COPY (`[...path]`) or every entry aliases one array that
//  ends up empty; and a candidate of 0 would loop forever — real inputs
//  are positive, and saying so is part of clarifying the question.

import { test, eq, ok } from '../../_lib/check.js';

export function combinationSum(candidates, target) {
  const out = [];
  const path = [];

  const walk = (index, remaining) => {
    if (remaining === 0) {
      out.push([...path]);
      return;
    }
    for (let i = index; i < candidates.length; i += 1) {
      if (candidates[i] > remaining) continue; // prune: cannot fit
      path.push(candidates[i]); // choose
      walk(i, remaining - candidates[i]); // explore (i, so it may repeat)
      path.pop(); // un-choose
    }
  };

  walk(0, target);
  return out;
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
