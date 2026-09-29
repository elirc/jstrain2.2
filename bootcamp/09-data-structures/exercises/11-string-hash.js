// ─────────────────────────────────────────────────────────────────────────
//  11 · hashing a string                                   ★☆☆ warm-up
//  concepts: hashing · bit operations · determinism
//  run: node 11-string-hash.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Before you can build a hash map you need the hash: a function that
//  turns any string into a number, always the same number for the same
//  text, and spread out enough that similar strings land far apart.
//
//      hashString('cat')  → some non-negative integer
//      hashString('cat') === hashString('cat')   → true   (deterministic)
//      hashString('cat') !== hashString('act')   → true   (order matters)
//
//      bucketIndex('cat', 8)  → a number in 0..7
//
//  Any decent algorithm counts. The classic is djb2: start at 5381, and
//  for every character do `hash = (hash * 33) ^ code`, keeping the result
//  a 32-bit integer with `| 0`, then return it unsigned with `>>> 0`.
//  Adding up character codes is NOT good enough — 'ab' and 'ba' would
//  collide, and so would every anagram in your data.

import { test, eq, ok } from '../../_lib/check.js';

export function hashString(text) {
  throw new Error('TODO');
}

export function bucketIndex(key, bucketCount) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the same string always hashes to the same number', () => {
  eq(hashString('hello world'), hashString('hello world'));
  eq(hashString(''), hashString(''));
});

test('always returns a non-negative integer', () => {
  for (const key of ['', 'a', 'zzzzzzzzzz', 'a longer sentence here', '💡']) {
    const h = hashString(key);
    ok(Number.isInteger(h), `expected an integer for ${JSON.stringify(key)}`);
    ok(h >= 0, `expected a non-negative number for ${JSON.stringify(key)}`);
  }
});

test('different words get different hashes', () => {
  ok(hashString('cat') !== hashString('dog'));
  ok(hashString('user:1') !== hashString('user:2'));
});

test('order matters, so anagrams do not collide', () => {
  ok(hashString('ab') !== hashString('ba'));
  ok(hashString('cat') !== hashString('act'));
});

test('a one-character difference changes the hash', () => {
  ok(hashString('session') !== hashString('sessions'));
});

test('bucketIndex always lands inside the table', () => {
  for (let n = 0; n < 200; n += 1) {
    const i = bucketIndex(`key-${n}`, 8);
    ok(Number.isInteger(i) && i >= 0 && i < 8, `out of range: ${i}`);
  }
});

test('bucketIndex is stable for the same key and size', () => {
  eq(bucketIndex('session-token', 16), bucketIndex('session-token', 16));
});

test('application: 200 user ids spread across all 8 buckets', () => {
  const counts = new Array(8).fill(0);
  for (let n = 0; n < 200; n += 1) counts[bucketIndex(`user-${n}`, 8)] += 1;
  ok(counts.every((c) => c > 0), `some bucket got nothing: ${counts}`);
  ok(counts.every((c) => c < 100), `one bucket took half the keys: ${counts}`);
});
