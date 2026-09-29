// ─────────────────────────────────────────────────────────────────────────
//  15 · permutations — SOLUTION                             ★★★ stretch
//  concepts: pattern: backtracking (choose / explore / un-choose)
//  run: node 15-permutations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: backtracking over "which slot comes next".
//  At each depth, try every character that is not already used: choose it
//  (push + mark used), explore one level deeper, un-choose (pop + unmark).
//  When the path is as long as the input, it is a finished permutation.
//  Duplicates: sort the characters first, then skip chars[i] when it
//  equals chars[i - 1] and that twin is NOT currently used. That means
//  the twin was already tried at this depth and rejected, so reusing this
//  character here would rebuild an identical branch. Sorting also makes
//  the output come out in lexicographic order for free.
//  Time O(n · n!) (n! leaves, O(n) to build each string), space O(n) for
//  the path plus the output. The naive "generate all n^n index tuples and
//  filter the invalid ones" is dramatically worse; the naive dedupe —
//  generate all n! and drop duplicates with a Set — works but still pays
//  for every doomed branch.

import { test, eq, ok } from '../../_lib/check.js';

export function permutations(text) {
  const chars = [...text].sort();
  const used = new Array(chars.length).fill(false);
  const out = [];
  const path = [];

  const walk = () => {
    if (path.length === chars.length) {
      out.push(path.join(''));
      return;
    }
    for (let i = 0; i < chars.length; i += 1) {
      if (used[i]) continue;
      if (i > 0 && chars[i] === chars[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      path.push(chars[i]);
      walk();
      path.pop();
      used[i] = false;
    }
  };

  walk();
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('produces every arrangement of three distinct characters', () => {
  eq(permutations('abc').sort(), ['abc', 'acb', 'bac', 'bca', 'cab', 'cba']);
});

test('produces n! results for distinct characters', () => {
  eq(permutations('abcd').length, 24);
  eq(permutations('abcde').length, 120);
});

test('drops duplicate arrangements when characters repeat', () => {
  eq(permutations('aab').sort(), ['aab', 'aba', 'baa']);
});

test('handles a single character', () => {
  eq(permutations('a'), ['a']);
});

test('the empty string has one arrangement: itself', () => {
  eq(permutations(''), ['']);
});

test('every result uses exactly the input characters', () => {
  const all = permutations('xyz');
  eq(all.length, 6);
  for (const p of all) {
    ok([...p].sort().join('') === 'xyz', `${p} is not a rearrangement`);
  }
});

test('results are unique even for an all-same string', () => {
  eq(permutations('aaa'), ['aaa']);
});
