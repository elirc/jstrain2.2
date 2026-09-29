// ─────────────────────────────────────────────────────────────────────────
//  12 · hash map from scratch                              ★★★ stretch
//  concepts: hashing · buckets · collision handling
//  run: node 12-hash-map.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Build the thing `Map` is. A fixed array of buckets; the hash of a key
//  picks the bucket; the bucket is a little list of [key, value] pairs, so
//  two keys landing in the same bucket is normal, not an error.
//
//      const m = new HashMap(8);         // 8 buckets
//      m.set('sky', 'blue');
//      m.get('sky')       → 'blue'
//      m.get('nope')      → undefined
//      m.set('sky', 'grey');             // overwrites, no second entry
//      m.has('sky')       → true
//      m.delete('sky')    → true         // false if it was not there
//
//      m.buckets  → [[], [['sky','grey']], [], ...]
//
//  `hashIndex(key)` must return a valid index into `this.buckets`. Reuse
//  djb2 from exercise 11.
//
//  hint: every operation is "find the bucket, then scan that ONE bucket
//  for the key" — and set() has to look before it leaps

import { test, eq, ok } from '../../_lib/check.js';

export class HashMap {
  constructor(bucketCount = 8) {
    this.buckets = Array.from({ length: bucketCount }, () => []);
  }

  hashIndex(key) {
    throw new Error('TODO');
  }

  set(key, value) {
    throw new Error('TODO');
  }

  get(key) {
    throw new Error('TODO');
  }

  has(key) {
    throw new Error('TODO');
  }

  delete(key) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('set then get returns the stored value', () => {
  const m = new HashMap();
  m.set('sky', 'blue');
  m.set('grass', 'green');
  eq(m.get('sky'), 'blue');
  eq(m.get('grass'), 'green');
  eq(m.get('ocean'), undefined, 'a key that was never set');
});

test('setting the same key twice overwrites instead of duplicating', () => {
  const m = new HashMap();
  m.set('sky', 'blue');
  m.set('sky', 'grey');
  eq(m.get('sky'), 'grey');
  eq(m.buckets.flat().length, 1, 'there should still be one entry');
});

test('has reports membership without returning the value', () => {
  const m = new HashMap();
  m.set('a', undefined);
  eq(m.has('a'), true, 'a key set to undefined is still present');
  eq(m.has('b'), false);
});

test('delete reports whether it removed anything', () => {
  const m = new HashMap();
  m.set('a', 1);
  eq(m.delete('a'), true);
  eq(m.delete('a'), false);
  eq(m.get('a'), undefined);
});

test('delete removes only the target key', () => {
  const m = new HashMap();
  m.set('a', 1);
  m.set('b', 2);
  m.set('c', 3);
  m.delete('b');
  eq(m.get('a'), 1);
  eq(m.get('c'), 3);
  eq(m.buckets.flat().length, 2);
});

test('hashIndex always points at a real bucket', () => {
  const m = new HashMap(4);
  for (const key of ['', 'a', 'zebra', 'user:42', 'a much longer key']) {
    const i = m.hashIndex(key);
    ok(Number.isInteger(i) && i >= 0 && i < 4, `bad index ${i} for ${key}`);
  }
});

test('collisions: a single-bucket map keeps its keys apart', () => {
  const m = new HashMap(1);
  m.set('one', 1);
  m.set('two', 2);
  m.set('three', 3);
  eq(m.buckets[0].length, 3, 'all three keys share the only bucket');
  eq(m.get('two'), 2);
  eq(m.delete('two'), true);
  eq(m.get('one'), 1);
  eq(m.get('three'), 3);
  eq(m.get('two'), undefined);
});

test('application: counts word frequency in a sentence', () => {
  const counts = new HashMap(8);
  const words = 'the cat sat on the mat the end'.split(' ');
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  eq(counts.get('the'), 3);
  eq(counts.get('cat'), 1);
  eq(counts.has('dog'), false);
  eq(counts.buckets.flat().length, 6, 'six distinct words');
});
