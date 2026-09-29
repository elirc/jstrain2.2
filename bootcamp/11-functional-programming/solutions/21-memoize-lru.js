// ─────────────────────────────────────────────────────────────────────────
//  21 · a bounded (LRU) memoize — SOLUTION                   ★★☆ core
//  run: node 21-memoize-lru.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a Map is already an ordered list of keys — oldest first —
//  so you do not need a linked list or a timestamp. Two moves are all an
//  LRU needs:
//    · on a HIT, delete the key and set it again. That re-insert moves it
//      to the END, marking it as the newest. Skipping this is the bug that
//      turns your LRU into a FIFO: it evicts your hottest key while cold
//      ones sit there, and every test EXCEPT "a hit rescues the entry"
//      still passes.
//    · on a MISS, insert, then if `size > max` delete
//      `cache.keys().next().value` — the oldest key.
//  `cache.has(key)` again, not a truthiness check, so `undefined` results
//  stay cached. And the cache is hung on the returned function so callers
//  (here, the tests) can see the eviction actually happen — a cache you
//  cannot inspect is a cache you cannot debug.

import { test, eq, spy } from '../../_lib/check.js';

const slugify = (title) => title.trim().toLowerCase().split(' ').join('-');

export function memoizeLRU(fn, max, keyFn = String) {
  const cache = new Map();
  const memoized = (arg) => {
    const key = keyFn(arg);
    if (cache.has(key)) {
      const hit = cache.get(key);
      cache.delete(key);
      cache.set(key, hit); // touched — now the newest
      return hit;
    }
    const value = fn(arg);
    cache.set(key, value);
    if (cache.size > max) cache.delete(cache.keys().next().value);
    return value;
  };
  memoized.cache = cache;
  return memoized;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a repeated argument is served from the cache', () => {
  const work = spy(slugify);
  const slugOf = memoizeLRU(work, 3);
  eq(slugOf('Hello There'), 'hello-there');
  eq(slugOf('Hello There'), 'hello-there');
  eq(work.callCount, 1);
});

test('different arguments each get computed and stored', () => {
  const work = spy(slugify);
  const slugOf = memoizeLRU(work, 3);
  slugOf('a b');
  slugOf('c d');
  eq(work.callCount, 2);
  eq(slugOf.cache.size, 2);
});

test('the cache never grows past max', () => {
  const slugOf = memoizeLRU(slugify, 2);
  ['a', 'b', 'c', 'd', 'e'].forEach((title) => slugOf(title));
  eq(slugOf.cache.size, 2);
});

test('the least recently used entry is the one evicted', () => {
  const slugOf = memoizeLRU(slugify, 2);
  slugOf('a');
  slugOf('b');
  slugOf('c');
  eq([...slugOf.cache.keys()], ['b', 'c']);
});

test('a cache HIT counts as a use and rescues the entry', () => {
  const slugOf = memoizeLRU(slugify, 2);
  slugOf('a');
  slugOf('b');
  slugOf('a'); // hit — 'a' is now the newest, 'b' the oldest
  slugOf('c');
  eq([...slugOf.cache.keys()], ['a', 'c']);
});

test('an evicted argument is recomputed on its next visit', () => {
  const work = spy(slugify);
  const slugOf = memoizeLRU(work, 2);
  slugOf('a');
  slugOf('b');
  slugOf('c'); // evicts 'a'
  eq(slugOf('a'), 'a');
  eq(work.callCount, 4);
});

test('keyFn decides what counts as the same argument', () => {
  const work = spy((point) => point.x + point.y);
  const sumOf = memoizeLRU(work, 4, (point) => `${point.x},${point.y}`);
  eq(sumOf({ x: 1, y: 2 }), 3);
  eq(sumOf({ x: 1, y: 2 }), 3);
  eq(work.callCount, 1, 'equal keys, one computation');
  eq(sumOf({ x: 9, y: 2 }), 11);
  eq(work.callCount, 2);
});

test('a cached undefined is still a hit', () => {
  const work = spy(() => undefined);
  const lookup = memoizeLRU(work, 2);
  eq(lookup('missing'), undefined);
  eq(lookup('missing'), undefined);
  eq(work.callCount, 1);
});
