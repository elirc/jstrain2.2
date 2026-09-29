// ─────────────────────────────────────────────────────────────────────────
//  07 · longestUnique                                       ★★★ stretch
//  concepts: pattern: sliding window (variable size) · last-seen index map
//  run: node 07-longest-unique-substring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return the LENGTH of the longest run of characters with no repeats.
//
//      longestUnique('abcabcbb')  → 3    ('abc')
//      longestUnique('bbbbb')     → 1    ('b')
//      longestUnique('pwwkew')    → 3    ('wke', not the subsequence
//                                         'pwke' — it must be contiguous)
//      longestUnique('')          → 0
//
//  Grow a window to the right; when the entering character is already
//  inside the window, shrink from the left until it is not.
//
//  hint: remember the last index you saw each character at, and never let
//  the left edge move BACKWARDS

import { test, eq } from '../../_lib/check.js';

export function longestUnique(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the longest repeat-free run', () => {
  eq(longestUnique('abcabcbb'), 3);
});

test('an all-same string has a run of 1', () => {
  eq(longestUnique('bbbbb'), 1);
});

test('the window must be contiguous, not a subsequence', () => {
  eq(longestUnique('pwwkew'), 3);
});

test('never drags the left edge backwards', () => {
  eq(longestUnique('abba'), 2);
});

test('handles a repeat that sits outside the window', () => {
  eq(longestUnique('dvdf'), 3);
});

test('an all-unique string is its own answer', () => {
  eq(longestUnique('abcdef'), 6);
});

test('handles empty and single-character strings', () => {
  eq(longestUnique(''), 0);
  eq(longestUnique('a'), 1);
});

test('counts spaces and punctuation as characters', () => {
  eq(longestUnique('a b a'), 3);
});
