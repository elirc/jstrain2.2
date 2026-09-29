// ─────────────────────────────────────────────────────────────────────────
//  47 · wordBreak — SOLUTION                                ★★★ stretch
//  concepts: pattern: DP over string positions · reachability
//  run: node 47-word-break.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: dynamic programming over positions in a string
//  (a reachability scan, not an optimisation).
//  Smell: "can this sequence be split into valid pieces" — segmentation,
//  tokenising, decoding a digit string into letters. Same shape.
//  reachable[i] means "the first i characters can be cut into words".
//  reachable[0] is true (the empty prefix). For every position i, look
//  back at each earlier reachable position j and ask whether
//  text.slice(j, i) is a word. One hit is enough — mark i and move on.
//  The answer is reachable[text.length].
//  Time O(n² · word length) with a Set for lookups; space O(n). Naive
//  recursion re-explores the same suffix through every path that reaches
//  it: exponential. The 40-a test is exactly that bomb — plain recursion
//  hangs on it, the table finishes instantly.
//  Bites: use a Set, not `words.includes(...)` inside the loop (a hidden
//  nested scan), and remember the greedy "longest match first" cut is
//  WRONG — 'catsandog' is the counter-example in the tests.

import { test, eq } from '../../_lib/check.js';

export function wordBreak(text, words) {
  const dictionary = new Set(words);
  const reachable = new Array(text.length + 1).fill(false);
  reachable[0] = true; // the empty prefix is always cut up
  for (let end = 1; end <= text.length; end += 1) {
    for (let start = 0; start < end; start += 1) {
      if (reachable[start] && dictionary.has(text.slice(start, end))) {
        reachable[end] = true;
        break;
      }
    }
  }
  return reachable[text.length];
}

// ──────────────────────────── tests ──────────────────────────────────────

test('cuts a string into two dictionary words', () => {
  eq(wordBreak('leetcode', ['leet', 'code']), true);
});

test('reuses a word as often as needed', () => {
  eq(wordBreak('applepenapple', ['apple', 'pen']), true);
  eq(wordBreak('aaaa', ['a', 'aa']), true);
});

test('backtracks past a greedy first match', () => {
  eq(wordBreak('catsandog', ['cats', 'dog', 'sand', 'and', 'cat']), false);
  eq(wordBreak('catsanddog', ['cats', 'dog', 'sand', 'and', 'cat']), true);
});

test('the empty string needs no words', () => {
  eq(wordBreak('', ['a']), true);
  eq(wordBreak('', []), true);
});

test('an empty dictionary breaks nothing', () => {
  eq(wordBreak('abc', []), false);
});

test('every character must be used', () => {
  eq(wordBreak('applex', ['apple']), false);
  eq(wordBreak('xapple', ['apple']), false);
});

test('stays fast on the exponential trap', () => {
  const text = 'a'.repeat(40) + 'b';
  eq(wordBreak(text, ['a', 'aa', 'aaa', 'aaaa']), false);
});
