// ─────────────────────────────────────────────────────────────────────────
//  51 · prefixFunction / kmpSearch                          ★★★ stretch
//  concepts: pattern: KMP prefix function · never re-read the text
//  run: node 51-prefix-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  prefixFunction(pattern) — for each position i, the length of the
//  longest PROPER prefix of pattern[0..i] that is also a suffix of it:
//
//      prefixFunction('ababaca')  → [0, 0, 1, 2, 3, 0, 1]
//      prefixFunction('aaaa')     → [0, 1, 2, 3]
//      prefixFunction('abcdef')   → [0, 0, 0, 0, 0, 0]
//
//  kmpSearch(text, pattern) — the index of the first occurrence, or -1.
//  Use the table: on a mismatch you already know how much of the pattern
//  still matches, so the text cursor NEVER goes backwards.
//
//      kmpSearch('abxabcabcaby', 'abcaby')  → 6
//      kmpSearch('aabaaab', 'aaab')         → 3
//      kmpSearch('abcabc', 'abcd')          → -1
//
//  An empty pattern matches at index 0.
//
//  hint: building the table is the same matching loop applied to the
//        pattern against itself — on a mismatch fall back to
//        table[length - 1] instead of restarting at 0

import { test, eq } from '../../_lib/check.js';

export function prefixFunction(pattern) {
  throw new Error('TODO');
}

export function kmpSearch(text, pattern) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('prefixFunction handles the classic pattern', () => {
  eq(prefixFunction('ababaca'), [0, 0, 1, 2, 3, 0, 1]);
});

test('prefixFunction counts a run of one repeated character', () => {
  eq(prefixFunction('aaaa'), [0, 1, 2, 3]);
});

test('prefixFunction is all zeros when nothing repeats', () => {
  eq(prefixFunction('abcdef'), [0, 0, 0, 0, 0, 0]);
});

test('prefixFunction handles empty and single-character patterns', () => {
  eq(prefixFunction(''), []);
  eq(prefixFunction('a'), [0]);
});

test('kmpSearch finds a match after a partial one', () => {
  eq(kmpSearch('abxabcabcaby', 'abcaby'), 6);
});

test('kmpSearch handles overlapping prefixes', () => {
  eq(kmpSearch('aabaaab', 'aaab'), 3);
  eq(kmpSearch('aaaaa', 'aaa'), 0);
});

test('kmpSearch returns -1 when the pattern is absent', () => {
  eq(kmpSearch('abcabc', 'abcd'), -1);
  eq(kmpSearch('abc', 'abcabc'), -1);
});

test('kmpSearch handles the empty pattern and empty text', () => {
  eq(kmpSearch('abc', ''), 0);
  eq(kmpSearch('', ''), 0);
  eq(kmpSearch('', 'a'), -1);
});
