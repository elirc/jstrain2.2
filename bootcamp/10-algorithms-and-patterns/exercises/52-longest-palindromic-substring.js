// ─────────────────────────────────────────────────────────────────────────
//  52 · longestPalindrome                                   ★★★ stretch
//  concepts: pattern: expand around center · odd and even centers
//  run: node 52-longest-palindromic-substring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return the longest palindromic SUBSTRING (contiguous, unlike exercise
//  22's subsequence). On a tie, return the leftmost one.
//
//      longestPalindrome('babad')             → 'bab'
//      longestPalindrome('cbbd')              → 'bb'
//      longestPalindrome('forgeeksskeegfor')  → 'geeksskeeg'
//      longestPalindrome('abc')               → 'a'
//      longestPalindrome('')                  → ''
//
//  Every palindrome has a center and grows outward symmetrically. There
//  are 2n - 1 possible centers, not n — 'bb' is centered between two
//  characters, not on one.
//
//  hint: one helper that expands from (left, right) while the characters
//        match, called twice per index: (i, i) and (i, i + 1)

import { test, eq } from '../../_lib/check.js';

export function longestPalindrome(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds an odd-length palindrome', () => {
  eq(longestPalindrome('babad'), 'bab');
});

test('finds an even-length palindrome', () => {
  eq(longestPalindrome('cbbd'), 'bb');
  eq(longestPalindrome('abba'), 'abba');
});

test('finds a long palindrome buried in a longer string', () => {
  eq(longestPalindrome('forgeeksskeegfor'), 'geeksskeeg');
});

test('the whole string can be the answer', () => {
  eq(longestPalindrome('racecar'), 'racecar');
});

test('with no repeats it returns the leftmost single character', () => {
  eq(longestPalindrome('abc'), 'a');
});

test('handles empty and single-character input', () => {
  eq(longestPalindrome(''), '');
  eq(longestPalindrome('z'), 'z');
});

test('handles a string of one repeated character', () => {
  eq(longestPalindrome('aaaa'), 'aaaa');
});

test('is case sensitive', () => {
  eq(longestPalindrome('Aa'), 'A');
});
