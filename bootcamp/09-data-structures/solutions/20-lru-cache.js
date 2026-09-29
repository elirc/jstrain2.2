// ─────────────────────────────────────────────────────────────────────────
//  20 · LRU cache — SOLUTION                               ★★★ stretch
//  run: node 20-lru-cache.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Map` guarantees insertion order, so "recency" is just
//  position. delete-then-set moves a key to the back (a plain re-set does
//  NOT — that is the detail the whole exercise hangs on), and
//  `map.keys().next().value` reads the front, the least recently used key,
//  without copying anything.
//  Everything is O(1): Map get/set/delete are hash operations, and the
//  order is maintained internally. The textbook implementation is a hash
//  map plus a doubly linked list — Map is that structure, already built.
//  Classic wrong turns: forgetting to promote on a HIT (a hot key then
//  ages out and your hit rate collapses), evicting before the insert
//  instead of after (you can evict the key you just added when capacity is
//  1), and letting `get` of a missing key insert undefined.
//  This is the pattern behind HTTP caches, database buffer pools and
//  memoisation with a budget — anywhere unbounded memoisation would leak.

import { test, eq } from '../../_lib/check.js';

export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value); // move to the back: most recently used
    return value;
  }

  set(key, value) {
    this.map.delete(key); // if it was there, drop the old position
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    return this;
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
