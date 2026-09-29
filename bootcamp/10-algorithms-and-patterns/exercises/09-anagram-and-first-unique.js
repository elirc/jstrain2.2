// ─────────────────────────────────────────────────────────────────────────
//  09 · isAnagram / firstNonRepeating                       ★☆☆ warm-up
//  concepts: pattern: frequency counting · count map, then read it
//  run: node 09-anagram-and-first-unique.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two problems, one pattern: build a map of character → how many times,
//  then answer the question from the map.
//
//      isAnagram('listen', 'silent')   → true
//      isAnagram('rat', 'car')         → false
//      firstNonRepeating('swiss')      → 'w'
//      firstNonRepeating('aabbcc')     → null
//
//  Both are case-sensitive and count every character, spaces included.
//  firstNonRepeating returns the FIRST character (in original order) that
//  appears exactly once, or null if there is none.

import { test, eq } from '../../_lib/check.js';

export function isAnagram(a, b) {
  throw new Error('TODO');
}

export function firstNonRepeating(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('isAnagram accepts a rearrangement', () => {
  eq(isAnagram('listen', 'silent'), true);
});

test('isAnagram rejects different letters', () => {
  eq(isAnagram('rat', 'car'), false);
});

test('isAnagram compares counts, not just which letters appear', () => {
  eq(isAnagram('aabb', 'abab'), true);
  eq(isAnagram('aabb', 'abbb'), false);
});

test('isAnagram rejects different lengths early', () => {
  eq(isAnagram('aa', 'a'), false);
});

test('isAnagram says two empty strings match', () => {
  eq(isAnagram('', ''), true);
});

test('firstNonRepeating finds the single character', () => {
  eq(firstNonRepeating('swiss'), 'w');
});

test('firstNonRepeating returns null when everything repeats', () => {
  eq(firstNonRepeating('aabbcc'), null);
});

test('firstNonRepeating handles empty and single-character text', () => {
  eq(firstNonRepeating(''), null);
  eq(firstNonRepeating('x'), 'x');
});
