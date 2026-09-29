// ─────────────────────────────────────────────────────────────────────────
//  52 · longestPalindrome — SOLUTION                        ★★★ stretch
//  concepts: pattern: expand around center · odd and even centers
//  run: node 52-longest-palindromic-substring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: expand around center.
//  Smell: "longest palindromic <anything contiguous>" / any structure
//  defined by symmetry around a point — count palindromic substrings is
//  the same loop with a counter instead of a max.
//  Every palindrome is fixed by its center, so enumerate the centers and
//  grow outward while the two ends agree. There are 2n - 1 centers: n on
//  a character (odd lengths) and n - 1 between characters (even lengths).
//  Forgetting the even centers is THE classic wrong turn — 'cbbd' then
//  answers 'b' instead of 'bb'.
//  Time O(n²) — n centers, each expanding O(n). Space O(1). That beats
//  the O(n³) "test every substring for palindromeness" brute force, and
//  is what interviewers expect. The 2-D DP table is also O(n²) but costs
//  O(n²) space; Manacher's algorithm gets O(n) — name it, don't write it.
//  Bite: scan centers left to right and only replace `best` on a STRICTLY
//  longer find, and ties resolve leftmost, as the 'babad' test requires.

import { test, eq } from '../../_lib/check.js';

export function longestPalindrome(text) {
  let bestStart = 0;
  let bestLength = text.length > 0 ? 1 : 0;

  const expand = (left, right) => {
    let lo = left;
    let hi = right;
    while (lo >= 0 && hi < text.length && text[lo] === text[hi]) {
      lo -= 1;
      hi += 1;
    }
    const length = hi - lo - 1; // lo and hi have both overshot by one
    if (length > bestLength) {
      bestLength = length;
      bestStart = lo + 1;
    }
  };

  for (let center = 0; center < text.length; center += 1) {
    expand(center, center); // odd length, centered on a character
    expand(center, center + 1); // even length, centered between two
  }
  return text.slice(bestStart, bestStart + bestLength);
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
