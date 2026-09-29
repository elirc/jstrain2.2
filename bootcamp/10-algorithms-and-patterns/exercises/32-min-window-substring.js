// ─────────────────────────────────────────────────────────────────────────
//  32 · minWindow                                           ★★★ stretch
//  concepts: pattern: variable sliding window · need-map + missing counter
//  run: node 32-min-window-substring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return the SHORTEST substring of `text` that contains every character
//  of `needle`, including repeats, in any order. Return '' if there is no
//  such substring.
//
//      minWindow('ADOBECODEBANC', 'ABC')  → 'BANC'
//      minWindow('bba', 'ab')             → 'ba'
//      minWindow('a', 'aa')               → ''      (only one 'a')
//
//  Grow the window on the right until it covers the needle, then shrink
//  from the left for as long as it still covers it — recording the
//  shortest cover you have seen.
//
//  hint: one Map of "how many of each character do I still need" plus a
//        single `missing` counter beats comparing two Maps every step

import { test, eq } from '../../_lib/check.js';

export function minWindow(text, needle) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the shortest cover in the classic input', () => {
  eq(minWindow('ADOBECODEBANC', 'ABC'), 'BANC');
});

test('the characters may appear in any order', () => {
  eq(minWindow('bba', 'ab'), 'ba');
});

test('respects repeated characters in the needle', () => {
  eq(minWindow('a', 'aa'), '');
  eq(minWindow('aab', 'aa'), 'aa');
});

test('returns the whole text when only the whole text covers it', () => {
  eq(minWindow('abc', 'cba'), 'abc');
});

test('returns an empty string when the needle cannot be covered', () => {
  eq(minWindow('abc', 'd'), '');
  eq(minWindow('', 'a'), '');
});

test('an empty needle has no window to find', () => {
  eq(minWindow('abc', ''), '');
});

test('ignores characters that are not in the needle', () => {
  eq(minWindow('xxxxbxxxxaxxxx', 'ab'), 'bxxxxa');
});

test('is case sensitive', () => {
  eq(minWindow('aA', 'A'), 'A');
});
