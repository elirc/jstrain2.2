// ─────────────────────────────────────────────────────────────────────────
//  12 · hash map from scratch — SOLUTION                   ★★★ stretch
//  run: node 12-hash-map.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the hash turns a key into an ARRAY INDEX, and array index
//  lookup is O(1) — that is the entire magic. Everything else is damage
//  control for collisions. Here each bucket is a small array of
//  [key, value] pairs ("separate chaining"), so a collision just means
//  scanning two or three pairs instead of one.
//  Cost: O(1) average for get/set/has/delete, O(n) worst case if every key
//  lands in one bucket — which is what the single-bucket test simulates.
//  Real maps keep the load factor (entries / buckets) around 0.75 and
//  rehash into a bigger table when it climbs; that resize is the O(n) step
//  amortised away.
//  Two classic wrong turns: storing one value per bucket (works until two
//  keys collide, then silently loses data), and using `if (bucket[i][1])`
//  to test presence, which mixes up "missing" with "stored false/0".
//
//  So why does JS ship `Map` if this is 40 lines? Because `Map` gets three
//  things right that a hand-rolled object cannot: any value as a key (not
//  just strings — objects compared by identity), guaranteed insertion
//  order when you iterate, and a `size` that is O(1) with no prototype
//  keys leaking in. A plain `{}` also inherits 'constructor', '__proto__'
//  and friends, so `'toString' in obj` is true for an empty object. Build
//  it once to understand it; use `Map` in production.

import { test, eq, ok } from '../../_lib/check.js';

function hashString(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash * 33) ^ text.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export class HashMap {
  constructor(bucketCount = 8) {
    this.buckets = Array.from({ length: bucketCount }, () => []);
  }

  hashIndex(key) {
    return hashString(String(key)) % this.buckets.length;
  }

  set(key, value) {
    const bucket = this.buckets[this.hashIndex(key)];
    const pair = bucket.find(([k]) => k === key);
    if (pair) pair[1] = value;
    else bucket.push([key, value]);
    return this;
  }

  get(key) {
    const bucket = this.buckets[this.hashIndex(key)];
    const pair = bucket.find(([k]) => k === key);
    return pair ? pair[1] : undefined;
  }

  has(key) {
    const bucket = this.buckets[this.hashIndex(key)];
    return bucket.some(([k]) => k === key);
  }

  delete(key) {
    const bucket = this.buckets[this.hashIndex(key)];
    const at = bucket.findIndex(([k]) => k === key);
    if (at === -1) return false;
    bucket.splice(at, 1);
    return true;
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
