// ─────────────────────────────────────────────────────────────────────────
//  03 · sumOf · toArray · nth                                ★★☆ core
//  concepts: consuming any iterable · generic code
//  run: node 03-iterable-tools.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Code that says `arr.length` only works on arrays. Code that says
//  `for (const x of thing)` works on arrays, strings, Sets, Maps,
//  generators and your own objects from exercise 02. Write three
//  helpers that never assume "array".
//
//      sumOf([1, 2, 3])              → 6
//      sumOf(new Set([1, 1, 2, 3]))  → 6      (a Set dedupes first)
//      toArray('hi')                 → ['h', 'i']
//      toArray(new Map([['a', 1]]))  → [['a', 1]]
//      nth(['a', 'b', 'c'], 1)       → 'b'    (0-based)
//      nth('abc', 9)                 → undefined
//
//  hint: no .length, no index access, no Array.isArray — one for-of
//        loop each is enough

import { test, eq } from '../../_lib/check.js';

// scaffolding: a hand-rolled iterable, so you can prove your helpers
// are generic and not secretly array-only. Do not edit.
const letters = {
  [Symbol.iterator]() {
    const chars = ['x', 'y', 'z'];
    let i = 0;
    return {
      next: () =>
        i < chars.length
          ? { value: chars[i++], done: false }
          : { value: undefined, done: true },
    };
  },
};

export function sumOf(iterable) {
  throw new Error('TODO');
}

export function toArray(iterable) {
  throw new Error('TODO');
}

export function nth(iterable, index) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sumOf adds up an array', () => {
  eq(sumOf([1, 2, 3, 4]), 10);
});

test('sumOf handles an empty iterable', () => {
  eq(sumOf([]), 0);
  eq(sumOf(new Set()), 0);
});

test('sumOf works on a Set, which drops duplicates first', () => {
  eq(sumOf(new Set([1, 1, 2, 3])), 6);
});

test('toArray copies an array and splits a string', () => {
  eq(toArray([1, 2]), [1, 2]);
  eq(toArray('hi'), ['h', 'i']);
});

test('toArray of a Map gives [key, value] pairs', () => {
  eq(
    toArray(
      new Map([
        ['a', 1],
        ['b', 2],
      ])
    ),
    [
      ['a', 1],
      ['b', 2],
    ]
  );
});

test('nth is 0-based and works on strings', () => {
  eq(nth(['a', 'b', 'c'], 1), 'b');
  eq(nth('abc', 0), 'a');
});

test('nth returns undefined past the end', () => {
  eq(nth([1, 2], 5), undefined);
  eq(nth(new Set(), 0), undefined);
});

test('all three work on a hand-rolled iterable', () => {
  eq(toArray(letters), ['x', 'y', 'z']);
  eq(nth(letters, 2), 'z');
  eq(sumOf([1, 2]), 3);
});
