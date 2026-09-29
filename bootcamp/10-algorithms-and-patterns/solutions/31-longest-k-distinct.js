// ─────────────────────────────────────────────────────────────────────────
//  31 · longestWithKDistinct — SOLUTION                     ★★☆ core
//  concepts: pattern: variable sliding window · Map of counts
//  run: node 31-longest-k-distinct.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: variable-size sliding window, "grow right,
//  shrink left while INVALID".
//  Smell: "longest contiguous run such that <some property holds>" — the
//  property here is `map.size <= k`.
//  Keep a Map of character → count for the current window. Add the
//  entering character; while the map holds more than k keys, drop the
//  character at `left` (decrement, and DELETE the key at 0) and step left
//  forward. Every window you measure is legal, so the max is the answer.
//  Time O(n) — each index enters once and leaves once. Space O(k).
//  The naive version generates every substring and counts its distinct
//  characters: O(n³), or O(n²) if you count incrementally.
//  Bite: `map.set(ch, count - 1)` without the `delete` leaves zero-count
//  keys behind, `map.size` never falls, and the window never reopens.

import { test, eq } from '../../_lib/check.js';

export function longestWithKDistinct(text, k) {
  if (k <= 0) return 0;
  const counts = new Map();
  let best = 0;
  let left = 0;
  for (let right = 0; right < text.length; right += 1) {
    const ch = text[right];
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
    while (counts.size > k) {
      const gone = text[left];
      const next = counts.get(gone) - 1;
      if (next === 0) counts.delete(gone);
      else counts.set(gone, next);
      left += 1;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the longest run with two distinct characters', () => {
  eq(longestWithKDistinct('araaci', 2), 4);
});

test('handles k of 1', () => {
  eq(longestWithKDistinct('araaci', 1), 2);
  eq(longestWithKDistinct('abc', 1), 1);
});

test('finds a run that ends before the string does', () => {
  eq(longestWithKDistinct('cbbebi', 3), 5);
});

test('takes the whole string when k covers every character', () => {
  eq(longestWithKDistinct('abc', 5), 3);
  eq(longestWithKDistinct('aaaa', 2), 4);
});

test('k of 0 admits nothing', () => {
  eq(longestWithKDistinct('abc', 0), 0);
});

test('handles the empty string', () => {
  eq(longestWithKDistinct('', 3), 0);
});

test('shrinks past a whole run of a dropped character', () => {
  eq(longestWithKDistinct('aaabbccc', 2), 5);
});
