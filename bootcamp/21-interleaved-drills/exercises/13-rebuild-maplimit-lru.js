// ─────────────────────────────────────────────────────────────────────────
//  13 · cold rebuild · mapLimit + LRU cache                ★★★ stretch
//  concepts: from memory
//  run: node 13-rebuild-maplimit-lru.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You built these before — rebuild without looking; then diff against
//  your module-07 solution (23-map-limit) and module-09 solution
//  (20-lru-cache). These two come up in interviews more than any other
//  practical build.
//
//    await mapLimit(items, limit, fn)
//      → results in INPUT order, with at most `limit` calls in flight at
//        any moment — and the whole budget actually used. `fn(item, i)`.
//        If any call rejects, the whole thing rejects.
//
//    new LRUCache(capacity)
//      .get(key)   the value, or undefined — and a hit counts as a USE
//      .set(k, v)  insert or update; over capacity, evict the least
//                  recently used key. Returns the cache.
//      .keys()     oldest → newest
//      .size()     how many entries are held
//      A get() that misses must not create an entry.

import { test, eq, ok, rejects } from '../../_lib/check.js';

// ── scaffolding: a task that records how many calls overlap ──────────────

export const tracker = { inFlight: 0, maxInFlight: 0 };

export const resetTracker = () => {
  tracker.inFlight = 0;
  tracker.maxInFlight = 0;
};

export function fetchOne(id, index) {
  tracker.inFlight += 1;
  tracker.maxInFlight = Math.max(tracker.maxInFlight, tracker.inFlight);
  return new Promise((resolve) =>
    setTimeout(() => {
      tracker.inFlight -= 1;
      resolve(`${id}${index}`);
    }, 8)
  );
}

export function mapLimit(items, limit, fn) {
  throw new Error('TODO');
}

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
    throw new Error('TODO');
  }

  size() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapLimit · maps every item, in input order', async () => {
  resetTracker();
  eq(await mapLimit(['a', 'b', 'c', 'd'], 2, fetchOne), [
    'a0',
    'b1',
    'c2',
    'd3',
  ]);
});

test('mapLimit · stays under the limit and still uses all of it', async () => {
  resetTracker();
  await mapLimit(['a', 'b', 'c', 'd', 'e', 'f'], 2, fetchOne);
  ok(tracker.maxInFlight <= 2, `saw ${tracker.maxInFlight} in flight`);
  ok(tracker.maxInFlight === 2, 'a sequential loop wastes the budget');
});

test('mapLimit · an empty list resolves to an empty list', async () => {
  resetTracker();
  eq(await mapLimit([], 3, fetchOne), []);
  eq(tracker.maxInFlight, 0);
});

test('mapLimit · one rejection rejects the whole thing', async () => {
  const flaky = async (id) => {
    if (id === 'c') throw new Error('socket closed');
    return id;
  };
  await rejects(() => mapLimit(['a', 'b', 'c', 'd'], 2, flaky), 'socket closed');
});

test('LRU · set then get, and a miss stores nothing', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  eq(cache.get('a'), 1);
  eq(cache.get('nope'), undefined);
  eq(cache.size(), 1);
});

test('LRU · over capacity, the least recently used key is evicted', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  eq(cache.keys(), ['b', 'c']);
  eq(cache.get('a'), undefined);
  eq(cache.size(), 2);
});

test('LRU · a get counts as a use', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.get('a');
  cache.set('c', 3);
  eq(cache.keys(), ['a', 'c']);
  eq(cache.get('b'), undefined);
});

test('LRU · re-setting a key updates it and refreshes it', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('a', 99);
  eq(cache.keys(), ['b', 'a']);
  cache.set('c', 3);
  eq(cache.keys(), ['a', 'c']);
  eq(cache.get('a'), 99);
});
