// ─────────────────────────────────────────────────────────────────────────
//  11 · hashing a string — SOLUTION                        ★☆☆ warm-up
//  run: node 11-string-hash.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: djb2 multiplies the running hash by 33 and mixes in the
//  next character code. The multiply is what makes position matter — 'ab'
//  and 'ba' feed the same codes in a different order and come out
//  different, while a plain sum could not tell them apart.
//  `| 0` after each step forces the value back into a signed 32-bit
//  integer, which keeps the arithmetic exact and fast; `>>> 0` at the end
//  reinterprets those same bits as unsigned so the result is never
//  negative (a negative hash makes `% bucketCount` return a negative index,
//  a bug you only notice on some keys). Hashing is O(length of the key) —
//  that is the "constant" hiding inside a hash map's O(1).

import { test, eq, ok } from '../../_lib/check.js';

export function hashString(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash * 33) ^ text.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export function bucketIndex(key, bucketCount) {
  return hashString(key) % bucketCount;
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
