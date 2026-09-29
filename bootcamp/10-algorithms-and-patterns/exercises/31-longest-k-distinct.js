// ─────────────────────────────────────────────────────────────────────────
//  31 · longestWithKDistinct                                ★★☆ core
//  concepts: pattern: variable sliding window · Map of counts
//  run: node 31-longest-k-distinct.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A vending machine only stocks k different products. Given a shelf of
//  items as a string, return the LENGTH of the longest contiguous run that
//  uses at most k distinct characters.
//
//      longestWithKDistinct('araaci', 2)  → 4   ('araa')
//      longestWithKDistinct('araaci', 1)  → 2   ('aa')
//      longestWithKDistinct('cbbebi', 3)  → 5   ('cbbeb')
//
//  Grow the window on the right. When it holds too many distinct
//  characters, shrink from the left until it is legal again.
//
//  hint: a Map from character → count; delete the key when its count
//        hits 0, or `map.size` will keep counting characters that left

import { test, eq } from '../../_lib/check.js';

export function longestWithKDistinct(text, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the longest run with two distinct characters', () => {
  eq(longestWithKDistinct('araaci', 2), 4);
});

test('handles k of 1', () => {
  eq(longestWithKDistinct('araaci', 1), 2);
  eq(longestWithKDistinct('abc', 1), 1);
});

test('finds a run that ends before the string does', () => {
  eq(longestWithKDistinct('cbbebi', 3), 5);
});

test('takes the whole string when k covers every character', () => {
  eq(longestWithKDistinct('abc', 5), 3);
  eq(longestWithKDistinct('aaaa', 2), 4);
});

test('k of 0 admits nothing', () => {
  eq(longestWithKDistinct('abc', 0), 0);
});

test('handles the empty string', () => {
  eq(longestWithKDistinct('', 3), 0);
});

test('shrinks past a whole run of a dropped character', () => {
  eq(longestWithKDistinct('aaabbccc', 2), 5);
});
