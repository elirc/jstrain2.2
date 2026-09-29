// ─────────────────────────────────────────────────────────────────────────
//  14 · subsets                                             ★★★ stretch
//  concepts: pattern: backtracking (include / exclude) · power set
//  run: node 14-subsets.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return every possible subset of the input (the "power set"), including
//  the empty subset and the full set. Order of the subsets does not
//  matter — the tests compare them as a set — but inside each subset the
//  elements must keep their original relative order.
//
//      subsets([1, 2])   → [[], [1], [2], [1, 2]]      (4 = 2^2)
//      subsets([])       → [[]]                        (1 = 2^0)
//
//  Every element faces one binary decision: in or out. n elements means
//  2^n leaves in the decision tree — that is why the answer is 2^n long
//  and why this problem is exponential by nature, not by sloppiness.
//
//  hint: recurse on "index", branching twice: skip this element, or take
//  it. When you record a subset, record a COPY.

import { test, eq, ok } from '../../_lib/check.js';

export function subsets(items) {
  throw new Error('TODO');
}

// helper for the tests: compare subsets regardless of their order
const canon = (lists) => lists.map((list) => list.join(',')).sort();

// ──────────────────────────── tests ──────────────────────────────────────

test('builds all 8 subsets of a 3-element array', () => {
  const expected = [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];
  eq(canon(subsets([1, 2, 3])), canon(expected));
});

test('the empty array has exactly one subset: the empty one', () => {
  eq(subsets([]), [[]]);
});

test('a single element gives the empty set and itself', () => {
  eq(canon(subsets(['a'])), canon([[], ['a']]));
});

test('subsets keep the original element order', () => {
  eq(canon(subsets(['a', 'b'])), ['', 'a', 'a,b', 'b']);
});

test('the count is 2 to the power of the input length', () => {
  eq(subsets([1, 2, 3, 4]).length, 16);
  eq(subsets([1, 2, 3, 4, 5]).length, 32);
});

test('every subset is distinct and is its own array', () => {
  const out = subsets([1, 2, 3]);
  eq(new Set(canon(out)).size, 8);
  ok(out[0] !== out[1], 'subsets must not share one array reference');
});

test('does not modify the input array', () => {
  const items = [1, 2, 3];
  subsets(items);
  eq(items, [1, 2, 3]);
});
