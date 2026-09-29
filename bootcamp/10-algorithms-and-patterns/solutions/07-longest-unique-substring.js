// ─────────────────────────────────────────────────────────────────────────
//  07 · longestUnique — SOLUTION                            ★★★ stretch
//  concepts: pattern: sliding window (variable size) · last-seen index map
//  run: node 07-longest-unique-substring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: variable-size sliding window with a lookup.
//  `right` always moves forward one character at a time. A Map remembers
//  the last index each character appeared at. If the entering character
//  was seen at index i AND i is inside the current window (i >= left),
//  jump `left` to i + 1 — everything before that can never be part of a
//  repeat-free window ending here. Record the window length each step.
//  Time O(n) — each index is visited once by `right` and `left` only ever
//  moves forward. Space O(min(n, alphabet)).
//  The naive answer generates every substring and checks each for
//  duplicates: O(n³), or O(n²) with a Set per start index.
//  THE classic wrong turn: `left = seen.get(ch) + 1` without the
//  `Math.max`. On 'abba', the second 'a' drags `left` back to 1 and the
//  window silently contains 'bba'. That is why the test exists.

import { test, eq } from '../../_lib/check.js';

export function longestUnique(text) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < text.length; right += 1) {
    const ch = text[right];
    if (lastSeen.has(ch)) {
      left = Math.max(left, lastSeen.get(ch) + 1);
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
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
