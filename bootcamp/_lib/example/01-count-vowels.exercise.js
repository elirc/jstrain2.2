// ─────────────────────────────────────────────────────────────────────────
//  01 · countVowels                                        ★☆☆ warm-up
//  concepts: strings · iteration
//  run: node 01-count-vowels.exercise.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Count how many vowels (a, e, i, o, u — case-insensitive) appear in a
//  string.
//
//      countVowels('JavaScript')   → 3   (a, a, i)
//      countVowels('fly')          → 0
//      countVowels('')             → 0
//
//  hint: 'aeiou'.includes(ch.toLowerCase())

import { test, eq } from '../check.js';

export function countVowels(text) {
  throw new Error('TODO');
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
