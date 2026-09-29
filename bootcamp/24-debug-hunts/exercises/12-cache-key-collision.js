// ─────────────────────────────────────────────────────────────────────────
//  12 · permission cache                                        ★★☆ core
//  concepts: bug hunt · memoization · cache keys
//  run: node 12-cache-key-collision.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `checkGrant(userId, docId)` is the slowest call in the request path,
//  so it is wrapped in a memoizer. The wrapper must be invisible: for
//  any argument list it returns exactly what the wrapped function would
//  have returned, and it calls the source at most once per DISTINCT
//  argument list.
//
//      memo('12', '345')  → true   (miss: the source runs)
//      memo('12', '345')  → true   (hit: the source does not)
//      memo('123', '45')  → false  (a different pair, a different answer)
//      memo.stats()       → { hits: 1, misses: 2, size: 2 }
//
//  The code below is fully written — and wrong. 2 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: a cache bug is always one of three things — the key, the
//  lifetime, or the scope. Log the key next to the arguments on every
//  call, then read the two lines that were supposed to differ.

import { test, eq, spy } from '../../_lib/check.js';

const GRANTS = new Set(['12:345', '7:88', '7:89']);

export function checkGrant(userId, docId) {
  return GRANTS.has(`${userId}:${docId}`);
}

export function memoize(fn) {
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const memoized = (...args) => {
    const key = args.join('');
    if (cache.has(key)) {
      hits += 1;
      return cache.get(key);
    }
    misses += 1;
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };

  memoized.stats = () => ({ hits, misses, size: cache.size });
  memoized.invalidate = () => {
    cache.clear();
  };
  return memoized;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the raw check is a plain lookup', () => {
  eq(checkGrant('12', '345'), true);
  eq(checkGrant('123', '45'), false);
  eq(checkGrant('7', '88'), true);
});

test('a repeated lookup is answered from the cache', () => {
  const source = spy(checkGrant);
  const memo = memoize(source);
  eq(memo('12', '345'), true);
  eq(memo('12', '345'), true);
  eq(source.callCount, 1);
  eq(memo.stats(), { hits: 1, misses: 1, size: 1 });
});

test('unrelated argument lists each reach the source', () => {
  const source = spy(checkGrant);
  const memo = memoize(source);
  eq(memo('7', '88'), true);
  eq(memo('7', '89'), true);
  eq(memo('9', '88'), false);
  eq(source.callCount, 3);
  eq(memo.stats().size, 3);
});

test('invalidate makes the next call reach the source again', () => {
  const source = spy(checkGrant);
  const memo = memoize(source);
  memo('7', '88');
  memo('7', '88');
  memo.invalidate();
  eq(memo('7', '88'), true);
  eq(source.callCount, 2);
});

test('two memoized functions do not share a cache', () => {
  const first = spy(checkGrant);
  const second = spy(checkGrant);
  const memoFirst = memoize(first);
  const memoSecond = memoize(second);
  memoFirst('7', '88');
  memoSecond('7', '88');
  eq(first.callCount, 1);
  eq(second.callCount, 1);
});

test('arguments that split differently are different lookups', () => {
  const source = spy(checkGrant);
  const memo = memoize(source);
  eq(memo('12', '345'), true);
  eq(memo('123', '45'), false);
  eq(source.callCount, 2);
});

test('how many arguments arrived is part of the identity', () => {
  const countArgs = spy((...parts) => parts.length);
  const memo = memoize(countArgs);
  eq(memo('a', 'b'), 2);
  eq(memo('ab'), 1);
  eq(countArgs.callCount, 2);
});
