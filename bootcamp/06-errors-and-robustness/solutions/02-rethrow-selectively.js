// ─────────────────────────────────────────────────────────────────────────
//  02 · rethrow selectively — SOLUTION                        ★★☆ core
//  run: node 02-rethrow-selectively.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a catch block is not "handle everything", it is "claim
//  what you recognise". Recognise the cache miss by its `code`, return
//  the fallback for that one case, and `throw err;` for everything else
//  so the layer above still gets a chance.
//  Note `return fallback` — not `fallback || something`; the fallback may
//  legitimately be null or 0.
//  Classic wrong turn: `catch { return fallback; }`. It also swallows the
//  TypeError from your own typo, and you debug the wrong system for a day.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function readWithFallback(read, fallback) {
  try {
    return read();
  } catch (err) {
    if (err && err.code === 'CACHE_MISS') return fallback;
    throw err;
  }
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
