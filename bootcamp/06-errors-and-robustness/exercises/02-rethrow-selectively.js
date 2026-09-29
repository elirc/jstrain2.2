// ─────────────────────────────────────────────────────────────────────────
//  02 · rethrow selectively                                   ★★☆ core
//  concepts: catch · rethrow · error codes
//  run: node 02-rethrow-selectively.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A cache read fails for two very different reasons: the key isn't there
//  (fine — use the fallback) or the cache server is down (not fine —
//  someone has to hear about it). A catch block that treats both the same
//  way quietly turns an outage into wrong data.
//
//  readWithFallback(read, fallback) calls read():
//    - returns normally               → return that value
//    - throws with code 'CACHE_MISS'  → return fallback
//    - anything else                  → rethrow it, untouched
//
//      readWithFallback(() => 'hot', 'cold')            → 'hot'
//      readWithFallback(() => { throw miss; }, 'cold')  → 'cold'
//      readWithFallback(() => { throw dbDown; }, 'x')   → throws dbDown
//
//  hint: `throw err;` inside a catch block rethrows the same object.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function readWithFallback(read, fallback) {
  throw new Error('TODO');
}

// ── test fixtures & helpers ──────────────────────────────────────────────

const cacheMiss = () =>
  Object.assign(new Error('key not in cache'), { code: 'CACHE_MISS' });

const dbDown = () =>
  Object.assign(new Error('redis is unreachable'), { code: 'ECONNREFUSED' });

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the value the read produced', () => {
  eq(readWithFallback(() => 'hot', 'cold'), 'hot');
});

test('falls back when the error is a cache miss', () => {
  eq(
    readWithFallback(() => {
      throw cacheMiss();
    }, 'cold'),
    'cold'
  );
});

test('rethrows the very same error object when the code differs', () => {
  const boom = dbDown();
  const caught = thrownBy(() =>
    readWithFallback(() => {
      throw boom;
    }, 'cold')
  );
  ok(caught === boom);
});

test('rethrows plain Errors that carry no code at all', () => {
  const bug = new TypeError('read is not a function');
  const caught = thrownBy(() =>
    readWithFallback(() => {
      throw bug;
    }, 'cold')
  );
  ok(caught === bug);
});

test('a null fallback is still a fallback', () => {
  eq(
    readWithFallback(() => {
      throw cacheMiss();
    }, null),
    null
  );
});

test('reads exactly once', () => {
  const read = spy(() => 'hot');
  readWithFallback(read, 'cold');
  eq(read.callCount, 1);
});
