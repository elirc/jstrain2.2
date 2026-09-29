// ─────────────────────────────────────────────────────────────────────────
//  09 · isAnagram / firstNonRepeating — SOLUTION            ★☆☆ warm-up
//  concepts: pattern: frequency counting · count map, then read it
//  run: node 09-anagram-and-first-unique.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: frequency counting (build a count map in one
//  pass, answer the question in a second pass).
//  isAnagram: bail on different lengths, count one string up, count the
//  other string down; any count that goes negative — or any leftover —
//  means a mismatch. Time O(n), space O(alphabet).
//  firstNonRepeating: pass 1 counts, pass 2 walks the ORIGINAL string in
//  order and returns the first character whose count is 1. Two passes are
//  required: you cannot know a character is unique until you have seen
//  the whole string. Time O(n), space O(alphabet).
//  Naive versions: sorting both strings for the anagram check is O(n log
//  n) (fine, and a legitimate answer — say the trade-off); for the unique
//  character, `indexOf(ch) === lastIndexOf(ch)` inside a loop is O(n²).
//  Bite: use a Map, not a bare `{}` — a plain object inherits keys like
//  'constructor', so counts['constructor'] starts out as a function.

import { test, eq } from '../../_lib/check.js';

function countChars(text) {
  const counts = new Map();
  for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return counts;
}

export function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const counts = countChars(a);
  for (const ch of b) {
    const left = counts.get(ch);
    if (!left) return false;
    counts.set(ch, left - 1);
  }
  return true;
}

export function firstNonRepeating(text) {
  const counts = countChars(text);
  for (const ch of text) {
    if (counts.get(ch) === 1) return ch;
  }
  return null;
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
