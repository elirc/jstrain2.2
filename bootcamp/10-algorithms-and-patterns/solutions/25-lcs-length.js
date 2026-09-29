// ─────────────────────────────────────────────────────────────────────────
//  25 · lcsLength — SOLUTION                                ★★★ stretch
//  concepts: pattern: dynamic programming on a grid · two-string table
//  run: node 25-lcs-length.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: 2-D dynamic programming. grid[i][j] is the
//  answer for the first i characters of `a` against the first j of `b`.
//  Row 0 and column 0 are 0 (an empty string shares nothing), which is
//  why the grid has one extra row and column — that padding removes every
//  boundary `if` from the loop.
//  Two cases per cell: if a[i-1] === b[j-1] the characters can both join
//  the subsequence, so grid[i][j] = grid[i-1][j-1] + 1; otherwise you
//  must drop one character, so take max(grid[i-1][j], grid[i][j-1]).
//  Time O(n·m), space O(n·m) — and O(min(n,m)) if you keep only the
//  previous row, which is the standard follow-up question.
//  The naive version enumerates all 2^n subsequences of `a` and checks
//  each against `b`: exponential. The grid works because every prefix
//  pair is asked about many times (overlapping subproblems again).
//  Bite: the index shift. Cell [i][j] talks about a[i-1] and b[j-1]; mix
//  that up and everything is off by one row.

import { test, eq } from '../../_lib/check.js';

export function lcsLength(a, b) {
  const grid = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      grid[i][j] =
        a[i - 1] === b[j - 1]
          ? grid[i - 1][j - 1] + 1
          : Math.max(grid[i - 1][j], grid[i][j - 1]);
    }
  }
  return grid[a.length][b.length];
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
