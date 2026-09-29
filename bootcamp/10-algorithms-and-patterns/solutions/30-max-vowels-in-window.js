// ─────────────────────────────────────────────────────────────────────────
//  30 · maxVowels — SOLUTION                                ★☆☆ warm-up
//  concepts: pattern: fixed sliding window · add one, drop one
//  run: node 30-max-vowels-in-window.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: fixed-size sliding window.
//  Smell: "contiguous" plus a FIXED length k — the window never changes
//  size, so each step is one addition and one subtraction.
//  Score the first k characters, then for every later index add the
//  entering character and drop the one that just left (index - k),
//  recording the best count as you go.
//  Time O(n), space O(1). The naive version re-counts every window from
//  scratch: O(n · k), which is O(n²) when k grows with the input.
//  Bites: return 0 when k is longer than the string — otherwise the
//  "first window" you seeded is a lie. And drop text[right - k], not
//  text[left] you forgot to advance.

import { test, eq } from '../../_lib/check.js';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

export function maxVowels(text, k) {
  if (k > text.length || k <= 0) return 0;
  let count = 0;
  for (let i = 0; i < k; i += 1) if (VOWELS.has(text[i])) count += 1;
  let best = count;
  for (let right = k; right < text.length; right += 1) {
    if (VOWELS.has(text[right])) count += 1;
    if (VOWELS.has(text[right - k])) count -= 1;
    if (count > best) best = count;
  }
  return best;
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
