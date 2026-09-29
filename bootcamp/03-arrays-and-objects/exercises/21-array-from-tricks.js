// ─────────────────────────────────────────────────────────────────────────
//  21 · Array.from tricks                                  ★☆☆ warm-up
//  concepts: Array.from · fill · iterables
//  run: node 21-array-from-tricks.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `Array.from` builds an array from anything array-like or iterable, and
//  takes an optional map function as its second argument.
//
//      zeros(3)                    → [0, 0, 0]
//      squares(5)                  → [0, 1, 4, 9, 16]
//      chars('abc')                → ['a', 'b', 'c']
//      toArray(new Set([1, 1, 2])) → [1, 2]
//
//  `new Array(3)` alone gives you three HOLES, not three undefineds —
//  holes are skipped by map/forEach, so fill them before you use them.

import { test, eq } from '../../_lib/check.js';

export function zeros(n) {
  throw new Error('TODO');
}

export function squares(n) {
  throw new Error('TODO');
}

export function chars(text) {
  throw new Error('TODO');
}

export function toArray(iterable) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('zeros builds a filled array, not a sparse one', () => {
  eq(zeros(3), [0, 0, 0]);
  eq(Object.keys(zeros(3)).length, 3);
});

test('zeros of 0 is an empty array', () => {
  eq(zeros(0), []);
});

test('squares uses the index the map function receives', () => {
  eq(squares(5), [0, 1, 4, 9, 16]);
  eq(squares(0), []);
});

test('chars splits a string into characters', () => {
  eq(chars('abc'), ['a', 'b', 'c']);
});

test('chars keeps an astral character in one piece', () => {
  const out = chars('hi\u{1F600}');
  eq(out.length, 3);
  eq(out[2], '\u{1F600}');
});

test('toArray drains any iterable', () => {
  eq(toArray(new Set([1, 1, 2])), [1, 2]);
  eq(toArray(new Map([['a', 1]])), [['a', 1]]);
});
