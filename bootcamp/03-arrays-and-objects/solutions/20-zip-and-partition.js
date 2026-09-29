// ─────────────────────────────────────────────────────────────────────────
//  20 · zip and partition — SOLUTION                       ★★☆ core
//  run: node 20-zip-and-partition.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `zip` is index arithmetic — take the shorter length so you
//  never read past the end and produce undefined pairs. `zipObject` is zip
//  plus `Object.fromEntries`, the inverse of `Object.entries`, and slicing
//  the keys to the number of values keeps a missing value from becoming an
//  `undefined` property (which is NOT the same as an absent one). For
//  `partition`, a reduce with a two-array accumulator does the job in one
//  pass; running `filter` twice with opposite predicates works but walks
//  the list twice and drifts out of sync the moment the predicate changes.

import { test, eq } from '../../_lib/check.js';

export function zip(a, b) {
  const length = Math.min(a.length, b.length);
  return Array.from({ length }, (_, i) => [a[i], b[i]]);
}

export function zipObject(keys, values) {
  return Object.fromEntries(
    keys.slice(0, values.length).map((key, i) => [key, values[i]])
  );
}

export function partition(items, predicate) {
  return items.reduce(
    (buckets, item) => {
      buckets[predicate(item) ? 0 : 1].push(item);
      return buckets;
    },
    [[], []]
  );
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
