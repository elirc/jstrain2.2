// ─────────────────────────────────────────────────────────────────────────
//  25 · lcsLength                                           ★★★ stretch
//  concepts: pattern: dynamic programming on a grid · two-string table
//  run: node 25-lcs-length.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Longest common SUBSEQUENCE: the longest sequence of characters that
//  appears in both strings in the same order, but not necessarily next to
//  each other. Return its length.
//
//      lcsLength('abcde', 'ace')      → 3     ('ace')
//      lcsLength('AGGTAB', 'GXTXAYB') → 4     ('GTAB')
//      lcsLength('abc', 'def')        → 0
//      lcsLength('abc', 'cba')        → 1
//
//  This is the engine behind `git diff` and every "what changed?" view.
//
//  hint: build a (a.length + 1) x (b.length + 1) grid where cell [i][j]
//  is the answer for the first i characters of a and first j of b. When
//  the characters match, the answer grows from the diagonal; when they do
//  not, it is the better of "drop one from a" and "drop one from b"

import { test, eq } from '../../_lib/check.js';

export function lcsLength(a, b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds a subsequence spread through the string', () => {
  eq(lcsLength('abcde', 'ace'), 3);
});

test('handles the classic AGGTAB / GXTXAYB pair', () => {
  eq(lcsLength('AGGTAB', 'GXTXAYB'), 4);
});

test('returns 0 when the strings share nothing', () => {
  eq(lcsLength('abc', 'def'), 0);
});

test('identical strings share everything', () => {
  eq(lcsLength('abc', 'abc'), 3);
});

test('order matters, so a reversal shares only one character', () => {
  eq(lcsLength('abc', 'cba'), 1);
});

test('handles empty strings on either side', () => {
  eq(lcsLength('', 'abc'), 0);
  eq(lcsLength('abc', ''), 0);
  eq(lcsLength('', ''), 0);
});

test('counts repeats only as often as both strings allow', () => {
  eq(lcsLength('aaa', 'aa'), 2);
});

test('is a subsequence, not a substring', () => {
  eq(lcsLength('abcdefg', 'aceg'), 4);
});
