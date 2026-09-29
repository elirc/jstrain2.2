// ─────────────────────────────────────────────────────────────────────────
//  15 · permutations                                        ★★★ stretch
//  concepts: pattern: backtracking (choose / explore / un-choose)
//  run: node 15-permutations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return every DISTINCT arrangement of a string's characters, as an
//  array of strings. Order of the array does not matter (the tests sort
//  it), but there must be no duplicates.
//
//      permutations('abc')  → ['abc','acb','bac','bca','cab','cba']
//      permutations('aab')  → ['aab', 'aba', 'baa']   (3, not 6)
//      permutations('a')    → ['a']
//      permutations('')     → ['']    (one arrangement of nothing)
//
//  n distinct characters give n! results — 10 characters is already 3.6
//  million, so this is a "small n only" tool.
//
//  hint: track which indices are already used; to kill duplicates, sort
//  the characters first and skip a character that equals its predecessor
//  when that predecessor is not currently used

import { test, eq, ok } from '../../_lib/check.js';

export function permutations(text) {
  throw new Error('TODO');
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
