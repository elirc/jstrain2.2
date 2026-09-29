// ─────────────────────────────────────────────────────────────────────────
//  51 · prefixFunction / kmpSearch — SOLUTION               ★★★ stretch
//  concepts: pattern: KMP prefix function · never re-read the text
//  run: node 51-prefix-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: the KMP prefix function (also called the
//  failure function or LPS table).
//  Smell: "substring search / repeated structure inside a string" where
//  the naive restart is too slow — and it is the standard answer to
//  "find the shortest repeating unit" too (n - table[n - 1] divides n).
//  table[i] = the longest proper prefix of pattern[0..i] that is also a
//  suffix. Build it by matching the pattern against ITSELF: keep a
//  candidate `length`; on a mismatch fall back to table[length - 1] —
//  the next-shortest border — instead of restarting at 0.
//  Searching then never rewinds the text cursor. On a mismatch the table
//  says how much of the pattern still matches at this position, so you
//  slide the pattern forward instead of the text backward.
//  Time O(n + m), space O(m). The naive scan re-compares from each start
//  index: O(n · m), which really bites on inputs like 'aaaa…aab'.
//  Bites: `table[0]` is 0 by definition — a whole string is not a PROPER
//  prefix of itself; and the fallback is a `while`, not an `if`, because
//  one shortening may not be enough.

import { test, eq } from '../../_lib/check.js';

export function prefixFunction(pattern) {
  const table = new Array(pattern.length).fill(0);
  let length = 0; // length of the current border
  for (let i = 1; i < pattern.length; i += 1) {
    while (length > 0 && pattern[i] !== pattern[length]) {
      length = table[length - 1]; // fall back to the next-shortest border
    }
    if (pattern[i] === pattern[length]) length += 1;
    table[i] = length;
  }
  return table;
}

export function kmpSearch(text, pattern) {
  if (pattern.length === 0) return 0;
  if (pattern.length > text.length) return -1;
  const table = prefixFunction(pattern);
  let matched = 0; // how many pattern characters currently line up
  for (let i = 0; i < text.length; i += 1) {
    while (matched > 0 && text[i] !== pattern[matched]) {
      matched = table[matched - 1];
    }
    if (text[i] === pattern[matched]) matched += 1;
    if (matched === pattern.length) return i - pattern.length + 1;
  }
  return -1;
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
