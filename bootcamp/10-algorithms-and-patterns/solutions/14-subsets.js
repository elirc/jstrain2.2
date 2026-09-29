// ─────────────────────────────────────────────────────────────────────────
//  14 · subsets — SOLUTION                                  ★★★ stretch
//  concepts: pattern: backtracking (include / exclude) · power set
//  run: node 14-subsets.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: backtracking. One shared `path` array, a
//  recursive step per element, and the three-line ritual: CHOOSE (push),
//  EXPLORE (recurse on index + 1), UN-CHOOSE (pop). The un-choose is what
//  makes it "backtracking" instead of plain recursion — it rewinds the
//  state so the sibling branch starts clean.
//  Base case: once index reaches the end, the path is a finished subset.
//  Time O(n · 2^n) — 2^n subsets, each copied out in O(n). Space O(n) for
//  the recursion depth plus the output itself.
//  The naive alternative is the bitmask loop: for mask 0..2^n - 1, take
//  element i when bit i is set. Same complexity, clever and compact, but
//  it does not generalise to permutations, N-queens or word search the
//  way backtracking does.
//  THE classic wrong turn: `out.push(path)` instead of `out.push([...path])`.
//  You then push the SAME array 2^n times and every entry ends up empty.

import { test, eq, ok } from '../../_lib/check.js';

export function subsets(items) {
  const out = [];
  const path = [];

  const walk = (index) => {
    if (index === items.length) {
      out.push([...path]);
      return;
    }
    walk(index + 1); // leave items[index] out
    path.push(items[index]); // choose
    walk(index + 1); // explore
    path.pop(); // un-choose
  };

  walk(0);
  return out;
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
