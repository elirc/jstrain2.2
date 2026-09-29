// ─────────────────────────────────────────────────────────────────────────
//  36 · a counted bag and its top k — SOLUTION                   ★★☆ core
//  run: node 36-counted-bag-topk.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: countWords is match() plus the get-or-default counting
//  idiom. The `?? []` after match is not decoration — match with /g
//  returns null when nothing matches, so text with no words would throw
//  on the for..of without it.
//  topK spreads the Map into an array of pairs first. That copy is the
//  point: sort() mutates in place, and a Map cannot be sorted anyway, so
//  spreading gives you something safe to reorder while the caller's Map
//  stays untouched.
//  The tiebreak is not written anywhere, and that is the lesson. A Map
//  iterates in insertion order, so the pairs start out in first-seen
//  order; Array.prototype.sort has been required to be STABLE since
//  ES2019, so entries with equal counts keep that order. Add a
//  `|| a[0].localeCompare(b[0])` to "help" and you have replaced
//  first-seen order with alphabetical order — and broken the tie test.

import { test, eq } from '../../_lib/check.js';

export function countWords(text) {
  const counts = new Map();
  for (const word of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

export function topK(counts, k) {
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, k);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('countWords counts repeats, ignoring case', () => {
  eq(countWords('The cat and the CAT.'), new Map([
    ['the', 2],
    ['cat', 2],
    ['and', 1],
  ]));
});

test('countWords treats punctuation as a separator', () => {
  eq([...countWords('a-b, c!').keys()], ['a', 'b', 'c']);
  eq(countWords('room 101').get('101'), 1);
});

test('countWords of text with no words is an empty Map', () => {
  eq(countWords('').size, 0);
  eq(countWords('...!').size, 0);
});

test('countWords keeps the words in first-seen order', () => {
  eq([...countWords('beta alpha beta').keys()], ['beta', 'alpha']);
});

test('topK returns the biggest counts first', () => {
  const counts = new Map([['a', 1], ['b', 5], ['c', 3]]);
  eq(topK(counts, 2), [['b', 5], ['c', 3]]);
});

test('topK breaks a tie in favour of the word seen first', () => {
  eq(topK(countWords('The cat and the CAT.'), 2), [['the', 2], ['cat', 2]]);
});

test('topK copes with a k past the end, and with k of 0', () => {
  const counts = countWords('one two two');
  eq(topK(counts, 99), [['two', 2], ['one', 1]]);
  eq(topK(counts, 0), []);
});

test('topK leaves the Map it was given alone', () => {
  const counts = new Map([['a', 1], ['b', 5]]);
  topK(counts, 1);
  eq([...counts.keys()], ['a', 'b']);
  eq(counts.size, 2);
});
