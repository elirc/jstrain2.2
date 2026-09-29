// ─────────────────────────────────────────────────────────────────────────
//  22 · isSubsequence / longestCommonPrefix — SOLUTION      ★☆☆ warm-up
//  concepts: pattern: two pointers on strings · column-wise scan
//  run: node 22-subsequence-and-prefix.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — two classic string scans.
//  isSubsequence — PATTERN: two pointers moving forward at different
//  speeds. `j` always advances through `big`; `i` only advances when the
//  characters match. If `i` reaches the end of `small`, every character
//  was found in order. Time O(n), space O(1). Greedy matching is safe
//  here: taking the EARLIEST possible match never hurts, because a later
//  match leaves strictly fewer characters for the rest.
//  longestCommonPrefix — PATTERN: column-wise scan. Walk position 0, 1,
//  2... and compare that character across all words; stop at the first
//  word that is too short or disagrees. Time O(total characters), space
//  O(1). The naive version sorts the words and compares only the first
//  and last (correct, but O(m·n log n) for no reason), or repeatedly
//  shortens a candidate prefix with `startsWith` — also fine but it
//  re-scans the prefix every time.
//  Bite: the empty list must return '' before you touch words[0].

import { test, eq } from '../../_lib/check.js';

export function isSubsequence(small, big) {
  let i = 0;
  for (let j = 0; j < big.length && i < small.length; j += 1) {
    if (small[i] === big[j]) i += 1;
  }
  return i === small.length;
}

export function longestCommonPrefix(words) {
  if (words.length === 0) return '';
  for (let column = 0; column < words[0].length; column += 1) {
    const ch = words[0][column];
    for (const word of words) {
      if (column >= word.length || word[column] !== ch) {
        return words[0].slice(0, column);
      }
    }
  }
  return words[0];
}

// ──────────────────────────── tests ──────────────────────────────────────

test('isSubsequence accepts characters spread through the text', () => {
  eq(isSubsequence('abc', 'ahbgdc'), true);
});

test('isSubsequence rejects a missing character', () => {
  eq(isSubsequence('axc', 'ahbgdc'), false);
});

test('isSubsequence respects order', () => {
  eq(isSubsequence('ba', 'abc'), false);
});

test('isSubsequence handles empty strings on either side', () => {
  eq(isSubsequence('', 'abc'), true);
  eq(isSubsequence('a', ''), false);
});

test('longestCommonPrefix finds the shared start', () => {
  eq(longestCommonPrefix(['flower', 'flow', 'flight']), 'fl');
});

test('longestCommonPrefix returns empty when nothing is shared', () => {
  eq(longestCommonPrefix(['dog', 'racecar', 'car']), '');
});

test('longestCommonPrefix stops at the shortest word', () => {
  eq(longestCommonPrefix(['inter', 'internal', 'internet']), 'inter');
});

test('longestCommonPrefix handles empty lists, single words, empty words', () => {
  eq(longestCommonPrefix([]), '');
  eq(longestCommonPrefix(['hi']), 'hi');
  eq(longestCommonPrefix(['a', '']), '');
});
