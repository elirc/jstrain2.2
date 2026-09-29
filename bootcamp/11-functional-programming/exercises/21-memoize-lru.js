// ─────────────────────────────────────────────────────────────────────────
//  21 · a bounded (LRU) memoize                              ★★☆ core
//  concepts: memoisation · cache eviction · Map ordering
//  run: node 21-memoize-lru.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An unbounded cache is a memory leak that takes a week to show up. Put a
//  ceiling on it: keep at most `max` entries and, when it overflows, throw
//  away the one that has gone longest without being used.
//
//      const slugOf = memoizeLRU(slugify, 2);
//      slugOf('a'); slugOf('b'); slugOf('c');
//      [...slugOf.cache.keys()]           → ['b', 'c']    ('a' evicted)
//
//  memoizeLRU(fn, max, keyFn = String) returns a one-argument function:
//    · a miss computes, stores, and evicts the oldest entry if size > max
//    · a HIT also counts as a use — that entry becomes the newest again
//    · `keyFn(arg)` decides what "the same argument" means
//    · the Map lives on the returned function as `.cache`, so it can be
//      inspected: `.cache.size`, `[...cache.keys()]` — oldest first
//
//  A Map remembers insertion order, and `map.keys().next().value` is the
//  oldest key still in it. Re-inserting a key does NOT move it to the end;
//  deleting and re-setting does.
//
//  hint: on a hit you need three lines, not one.

import { test, eq, spy } from '../../_lib/check.js';

const slugify = (title) => title.trim().toLowerCase().split(' ').join('-');

export function memoizeLRU(fn, max, keyFn = String) {
  throw new Error('TODO');
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
