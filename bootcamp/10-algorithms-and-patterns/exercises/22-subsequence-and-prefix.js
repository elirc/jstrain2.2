// ─────────────────────────────────────────────────────────────────────────
//  22 · isSubsequence / longestCommonPrefix                 ★☆☆ warm-up
//  concepts: pattern: two pointers on strings · column-wise scan
//  run: node 22-subsequence-and-prefix.js
// ─────────────────────────────────────────────────────────────────────────
//
//  isSubsequence(small, big): can you get `small` by deleting characters
//  from `big` without reordering what is left?
//
//      isSubsequence('abc', 'ahbgdc')  → true
//      isSubsequence('axc', 'ahbgdc')  → false
//      isSubsequence('ba', 'abc')      → false   (order matters)
//      isSubsequence('', 'abc')        → true
//
//  longestCommonPrefix(words): the longest string every word starts with.
//
//      longestCommonPrefix(['flower', 'flow', 'flight'])  → 'fl'
//      longestCommonPrefix(['dog', 'racecar'])            → ''
//      longestCommonPrefix([])                            → ''

import { test, eq } from '../../_lib/check.js';

export function isSubsequence(small, big) {
  throw new Error('TODO');
}

export function longestCommonPrefix(words) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('isSubsequence accepts characters spread through the text', () => {
  eq(isSubsequence('abc', 'ahbgdc'), true);
});

test('isSubsequence rejects a missing character', () => {
  eq(isSubsequence('axc', 'ahbgdc'), false);
});

test('isSubsequence respects order', () => {
  eq(isSubsequence('ba', 'abc'), false);
});

test('isSubsequence handles empty strings on either side', () => {
  eq(isSubsequence('', 'abc'), true);
  eq(isSubsequence('a', ''), false);
});

test('longestCommonPrefix finds the shared start', () => {
  eq(longestCommonPrefix(['flower', 'flow', 'flight']), 'fl');
});

test('longestCommonPrefix returns empty when nothing is shared', () => {
  eq(longestCommonPrefix(['dog', 'racecar', 'car']), '');
});

test('longestCommonPrefix stops at the shortest word', () => {
  eq(longestCommonPrefix(['inter', 'internal', 'internet']), 'inter');
});

test('longestCommonPrefix handles empty lists, single words, empty words', () => {
  eq(longestCommonPrefix([]), '');
  eq(longestCommonPrefix(['hi']), 'hi');
  eq(longestCommonPrefix(['a', '']), '');
});
