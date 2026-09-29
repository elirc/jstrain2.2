// ─────────────────────────────────────────────────────────────────────────
//  21 · Array.from tricks — SOLUTION                       ★☆☆ warm-up
//  run: node 21-array-from-tricks.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Array.from({ length: n }, (_, i) => ...)` is the standard
//  "build n things" idiom — the object with a length is array-like enough
//  for `from`, and the map callback gets the index. `new Array(n).fill(0)`
//  is the other route; the `fill` matters because a sparse array's holes
//  make `map` silently skip every slot. Watch out for `fill` with an object
//  or array: every slot gets the SAME reference, so pushing into one pushes
//  into all. `Array.from(string)` splits by code point, so an emoji stays
//  in one piece where `split('')` cuts it in half. And `Array.of(7)` is
//  `[7]` while `Array(7)` is seven holes.

import { test, eq } from '../../_lib/check.js';

export function zeros(n) {
  return new Array(n).fill(0);
}

export function squares(n) {
  return Array.from({ length: n }, (_, i) => i * i);
}

export function chars(text) {
  return Array.from(text);
}

export function toArray(iterable) {
  return Array.from(iterable);
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
