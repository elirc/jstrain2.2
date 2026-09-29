// ─────────────────────────────────────────────────────────────────────────
//  30 · maxVowels                                           ★☆☆ warm-up
//  concepts: pattern: fixed sliding window · add one, drop one
//  run: node 30-max-vowels-in-window.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return the largest number of vowels (a e i o u) found in any window of
//  exactly `k` consecutive characters.
//
//      maxVowels('abciiidef', 3)  → 3   ('iii')
//      maxVowels('leetcode', 3)   → 2   ('eet' / 'eco')
//      maxVowels('bbbbb', 2)      → 0
//
//  If the string is shorter than k there is no such window: answer 0.
//  Count the first window once, then slide: each step adds one character
//  on the right and drops one on the left.

import { test, eq } from '../../_lib/check.js';

export function maxVowels(text, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the vowel-heaviest window', () => {
  eq(maxVowels('abciiidef', 3), 3);
});

test('counts every vowel letter', () => {
  eq(maxVowels('aeiou', 2), 2);
  eq(maxVowels('aeiou', 5), 5);
});

test('finds a window that is not at the start', () => {
  eq(maxVowels('leetcode', 3), 2);
});

test('returns 0 when there are no vowels at all', () => {
  eq(maxVowels('bbbbb', 2), 0);
});

test('returns 0 when the string is shorter than the window', () => {
  eq(maxVowels('ab', 5), 0);
  eq(maxVowels('', 3), 0);
});

test('handles a window of exactly one character', () => {
  eq(maxVowels('a', 1), 1);
  eq(maxVowels('xyz', 1), 0);
});
