// ─────────────────────────────────────────────────────────────────────────
//  13 · cold rebuild · mapLimit + LRU cache — SOLUTION     ★★★ stretch
//  run: node 13-rebuild-maplimit-lru.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — two shapes worth having in your fingers.
//
//  mapLimit is a WORKER POOL, not a chunker. Start `limit` async workers
//  that share one cursor; each worker takes the next index, awaits it,
//  and loops. Because every worker grabs its index before awaiting, the
//  results land in `out[i]` and input order survives even though the
//  calls finish out of order. `Promise.all` over the workers both waits
//  for the pool to drain and propagates the first rejection.
//  The common wrong turn is slicing the list into batches of `limit`:
//  it "works", but a batch waits for its slowest member before the next
//  one starts, so the pool sits idle and one slow item stalls everything.
//
//  LRUCache leans on a fact about `Map`: it iterates in INSERTION order,
//  and re-setting an existing key does NOT move it. So delete-then-set is
//  the whole recency trick — front of the Map is stale, back is hot.
//  `get` must do it too, or a read never refreshes anything and you have
//  built a FIFO with extra steps. Evict with
//  `map.keys().next().value`, the first (oldest) key, and check size
//  AFTER inserting so an update of an existing key never evicts.

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

export async function mapLimit(items, limit, fn) {
  const list = [...items];
  const out = new Array(list.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < list.length) {
      const i = cursor;
      cursor += 1;
      out[i] = await fn(list[i], i);
    }
  };

  const size = Math.min(limit, list.length);
  await Promise.all(Array.from({ length: size }, worker));
  return out;
}

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
    this.map.delete(key); // drop the old position, if any
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value); // the oldest
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
