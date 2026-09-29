// ─────────────────────────────────────────────────────────────────────────
//  01 · countVowels — SOLUTION                             ★☆☆ warm-up
//  run: node 01-count-vowels.solution.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: turn the string into characters, keep the vowels, count
//  them. `for...of` iterates a string character by character, so no
//  split() is needed. Lowercasing once per character makes the check
//  case-insensitive.

import { test, eq } from '../check.js';

export function countVowels(text) {
  let count = 0;
  for (const ch of text) {
    if ('aeiou'.includes(ch.toLowerCase())) count += 1;
  }
  return count;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('counts lowercase vowels', () => {
  eq(countVowels('javascript'), 3);
});

test('is case-insensitive', () => {
  eq(countVowels('AEIOU aeiou'), 10);
});

test('returns 0 when there are no vowels', () => {
  eq(countVowels('rhythm'), 0);
});

test('handles the empty string', () => {
  eq(countVowels(''), 0);
});
