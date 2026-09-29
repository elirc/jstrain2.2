// ─────────────────────────────────────────────────────────────────────────
//  20 · LRU cache                                          ★★★ stretch
//  concepts: Map insertion order · eviction policy · O(1) design
//  run: node 20-lru-cache.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A cache with a memory budget has to throw something away. "Least
//  recently used" is the workhorse policy: when you are over capacity,
//  evict whatever nobody has touched for the longest.
//
//  The trick is that a JS `Map` iterates in INSERTION order, and deleting
//  a key then setting it again moves it to the end. So the Map is your
//  recency list: front = stale, back = hot.
//
//      const cache = new LRUCache(2);
//      cache.set('a', 1);
//      cache.set('b', 2);
//      cache.get('a')     → 1        'a' is now the most recent
//      cache.set('c', 3);            over capacity: 'b' is evicted
//      cache.keys()       → ['a', 'c']
//      cache.get('b')     → undefined
//
//  `keys()` (oldest → newest) and `size()` are provided for the tests.
//  A get() that misses must not create an entry.
//
//  hint: `map.keys().next().value` is the oldest key — Map remembers the
//  order you inserted in, and re-setting a key does NOT refresh it

import { test, eq } from '../../_lib/check.js';

export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    throw new Error('TODO');
  }

  set(key, value) {
    throw new Error('TODO');
  }

  keys() {
    return [...this.map.keys()]; // oldest → newest
  }

  size() {
    return this.map.size;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('get on a missing key returns undefined and stores nothing', () => {
  const cache = new LRUCache(2);
  eq(cache.get('nope'), undefined);
  eq(cache.size(), 0);
});

test('set then get returns the value', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  eq(cache.get('a'), 1);
  eq(cache.size(), 1);
});

test('keys are listed oldest first', () => {
  const cache = new LRUCache(3);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  eq(cache.keys(), ['a', 'b', 'c']);
});

test('the oldest key is evicted when capacity is exceeded', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  eq(cache.keys(), ['b', 'c']);
  eq(cache.get('a'), undefined);
  eq(cache.size(), 2);
});

test('a get promotes a key so it survives the next eviction', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.get('a');
  eq(cache.keys(), ['b', 'a'], 'touching a moved it to the back');
  cache.set('c', 3);
  eq(cache.keys(), ['a', 'c'], 'b was the stale one');
});

test('setting an existing key updates the value and promotes it', () => {
  const cache = new LRUCache(3);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  cache.set('a', 99);
  eq(cache.get('a'), 99);
  eq(cache.keys(), ['b', 'c', 'a']);
  eq(cache.size(), 3, 'an update must not grow the cache');
});

test('a capacity of 1 keeps only the newest entry', () => {
  const cache = new LRUCache(1);
  cache.set('a', 1);
  cache.set('b', 2);
  eq(cache.keys(), ['b']);
  eq(cache.get('a'), undefined);
  eq(cache.get('b'), 2);
});

test('application: caches 3 API responses and keeps the hot one', () => {
  const cache = new LRUCache(3);
  cache.set('/users/1', { name: 'ada' });
  cache.set('/users/2', { name: 'linus' });
  cache.set('/users/3', { name: 'grace' });
  eq(cache.get('/users/1'), { name: 'ada' }, 'a cache hit');
  cache.set('/users/4', { name: 'alan' });
  eq(cache.keys(), ['/users/3', '/users/1', '/users/4']);
  eq(cache.get('/users/2'), undefined, 'the coldest entry was evicted');
});
