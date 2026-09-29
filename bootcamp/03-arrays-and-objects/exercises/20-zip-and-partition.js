// ─────────────────────────────────────────────────────────────────────────
//  20 · zip and partition                                  ★★☆ core
//  concepts: pairing lists · fromEntries · splitting in one pass
//  run: node 20-zip-and-partition.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two shapes that keep coming up: pairing parallel lists, and splitting
//  one list into "matched" and "didn't".
//
//      zip([1, 2], ['a', 'b'])        → [[1, 'a'], [2, 'b']]
//      zip([1, 2, 3], ['a'])          → [[1, 'a']]   shorter list wins
//      zipObject(['a', 'b'], [1, 2])  → { a: 1, b: 2 }
//      partition([1, 2, 3, 4], (n) => n % 2 === 0)  → [[2, 4], [1, 3]]
//
//  `partition` always returns exactly two arrays — matches first — even
//  when one of them is empty.
//
//  hint: `Object.fromEntries` turns a list of [key, value] pairs straight
//  into an object.

import { test, eq } from '../../_lib/check.js';

export function zip(a, b) {
  throw new Error('TODO');
}

export function zipObject(keys, values) {
  throw new Error('TODO');
}

export function partition(items, predicate) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('zip pairs items by position', () => {
  eq(zip([1, 2], ['a', 'b']), [[1, 'a'], [2, 'b']]);
});

test('zip stops at the shorter list', () => {
  eq(zip([1, 2, 3], ['a']), [[1, 'a']]);
  eq(zip([], ['a']), []);
});

test('zipObject builds an object from two lists', () => {
  eq(zipObject(['a', 'b'], [1, 2]), { a: 1, b: 2 });
});

test('zipObject drops keys that have no value', () => {
  eq(zipObject(['a', 'b', 'c'], [1, 2]), { a: 1, b: 2 });
});

test('partition puts matches first, misses second', () => {
  eq(partition([1, 2, 3, 4], (n) => n % 2 === 0), [[2, 4], [1, 3]]);
});

test('partition still returns two arrays when one side is empty', () => {
  eq(partition([1, 3], (n) => n % 2 === 0), [[], [1, 3]]);
  eq(partition([], () => true), [[], []]);
});

test('partition keeps the original order inside each bucket', () => {
  const words = Object.freeze(['bat', 'ox', 'cow', 'ant']);
  eq(partition(words, (w) => w.length === 3), [
    ['bat', 'cow', 'ant'],
    ['ox'],
  ]);
  eq(words, ['bat', 'ox', 'cow', 'ant']);
});
