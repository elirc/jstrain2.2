// ─────────────────────────────────────────────────────────────────────────
//  36 · a counted bag and its top k                              ★★☆ core
//  concepts: counting Map · stable sort · insertion order as a tiebreak
//  run: node 36-counted-bag-topk.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "What are the ten most common X" is the report every log pipeline
//  ends with. Count into a Map, then take the top of the pile.
//
//      countWords('The cat and the CAT.')
//        → Map { 'the' → 2, 'cat' → 2, 'and' → 1 }
//
//      topK(counts, 2)  → [['the', 2], ['cat', 2]]
//      topK(counts, 9)  → [['the', 2], ['cat', 2], ['and', 1]]
//
//  countWords lowercases and treats any run of letters and digits as a
//  word — punctuation is a separator, never part of a word.
//
//  topK returns [word, count] pairs, biggest count first. Ties keep the
//  order the words were first seen in, which you get for free: a Map
//  iterates in insertion order and Array.prototype.sort is stable, so
//  equal counts never swap. topK must not modify the Map it is given.
//
//  hint: [...counts] gives you an array of [key, value] pairs — sort a
//  copy, never the Map, and slice(0, k) at the end.

import { test, eq } from '../../_lib/check.js';

export function countWords(text) {
  throw new Error('TODO');
}

export function topK(counts, k) {
  throw new Error('TODO');
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
