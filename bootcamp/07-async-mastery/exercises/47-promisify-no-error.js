// ─────────────────────────────────────────────────────────────────────────
//  47 · promisifyValue (callbacks with no error)           ★☆☆ warm-up
//  concepts: promisify · legacy callbacks · falsy values
//  run: node 47-promisify-no-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Not every callback is error-first. The old `fs.exists(path, cb)` calls
//  back with a bare boolean; plenty of APIs call back with nothing at all.
//  Hand those to an error-first promisify and `false` becomes a rejection.
//  Build the variant that has no error slot:
//
//      const has = promisifyValue(exists);
//      await has('/tmp')    → true
//      await has('/nope')   → false     (a value, NOT a failure)
//
//  Rules:
//    · returns a reusable function; the promise is made per call
//    · resolves with the callback's FIRST argument
//    · resolves `undefined` when the callback is given nothing
//    · `false`, `0`, `null` and `''` are values — it never rejects for them

import { test, eq, ok, rejects } from '../../_lib/check.js';

// Legacy APIs with no error argument at all.
export function exists(path, cb) {
  setTimeout(() => cb(path !== '/nope'), 10);
}

export function readCount(bucket, cb) {
  setTimeout(() => cb(bucket === 'empty' ? 0 : 12), 10);
}

export function warmUp(cb) {
  setTimeout(() => cb(), 10);
}

export function needsPath(path, cb) {
  if (typeof path !== 'string') throw new TypeError('path must be a string');
  setTimeout(() => cb(true), 10);
}

export function promisifyValue(fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a reusable function, not a promise', () => {
  const has = promisifyValue(exists);
  ok(typeof has === 'function');
  ok(!(has instanceof Promise));
});

test('resolves with the single value the callback receives', async () => {
  eq(await promisifyValue(exists)('/tmp'), true);
});

test('resolves with false rather than rejecting', async () => {
  eq(await promisifyValue(exists)('/nope'), false);
});

test('treats 0 as a value too', async () => {
  eq(await promisifyValue(readCount)('empty'), 0);
});

test('resolves undefined when the callback gets nothing', async () => {
  eq(await promisifyValue(warmUp)(), undefined);
});

test('passes the leading arguments through to fn', async () => {
  const seen = [];
  const wrapped = promisifyValue((a, b, cb) => {
    seen.push(a, b);
    cb(a * b);
  });
  eq(await wrapped(3, 4), 12);
  eq(seen, [3, 4]);
});

test('one wrapper serves many calls', async () => {
  const has = promisifyValue(exists);
  eq(await Promise.all([has('/tmp'), has('/nope')]), [true, false]);
});

test('a synchronous throw inside fn becomes a rejection', async () => {
  await rejects(promisifyValue(needsPath)(42), 'path must be a string');
});
