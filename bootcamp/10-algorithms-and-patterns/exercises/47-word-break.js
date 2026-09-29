// ─────────────────────────────────────────────────────────────────────────
//  47 · wordBreak                                           ★★★ stretch
//  concepts: pattern: DP over string positions · reachability
//  run: node 47-word-break.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Can `text` be cut into a sequence of dictionary words? Words may be
//  reused as often as you like, and every character must be used.
//
//      wordBreak('applepenapple', ['apple', 'pen'])            → true
//      wordBreak('catsandog', ['cats','dog','sand','and','cat']) → false
//      wordBreak('aaaa', ['a', 'aa'])                          → true
//
//  The second one is the trap: a left-to-right greedy match takes 'cats',
//  then 'and', and dies on 'og' — even though 'cat' + 'sand' + ... also
//  fails. You need to remember which positions are reachable, not just
//  the first cut that looked good.
//
//  hint: reachable[i] = "the first i characters can be cut up"; a position
//        is reachable if some earlier reachable position is followed by a
//        word ending here

import { test, eq } from '../../_lib/check.js';

export function wordBreak(text, words) {
  throw new Error('TODO');
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
