// ─────────────────────────────────────────────────────────────────────────
//  03 · sumOf · toArray · nth — SOLUTION                     ★★☆ core
//  run: node 03-iterable-tools.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one for-of loop each. Because for-of only asks for
//  `[Symbol.iterator]`, the same three functions serve arrays, strings,
//  Sets, Maps and the hand-rolled object below — you wrote no
//  type checks at all. That is the whole payoff of the protocol.
//
//  nth returns early instead of collecting everything first. On an
//  array that hardly matters; on an infinite generator (exercise 07)
//  `toArray(it)[index]` would hang forever. Prefer the loop that stops.

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
  let total = 0;
  for (const value of iterable) total += value;
  return total;
}

export function toArray(iterable) {
  const out = [];
  for (const value of iterable) out.push(value);
  return out;
}

export function nth(iterable, index) {
  let i = 0;
  for (const value of iterable) {
    if (i === index) return value;
    i += 1;
  }
  return undefined;
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
