// ─────────────────────────────────────────────────────────────────────────
//  47 · promisifyValue (no error argument) — SOLUTION      ★☆☆ warm-up
//  run: node 47-promisify-no-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: no error slot means there is nothing to branch on — the
//  callback IS the resolve. Collect the caller's arguments with a rest
//  parameter, append your own callback, and resolve with whatever it is
//  handed. The whole wrapper is four lines because the hard part of
//  promisify (deciding what counts as a failure) does not exist here.
//  That is exactly why this variant matters. Run `fs.exists` through an
//  error-first promisify and `false` — a perfectly good answer — lands in
//  your catch block as "the file check failed". Node deprecated
//  `fs.exists` partly for this reason, and `util.promisify` refuses it
//  outright unless the module supplies a custom implementation.
//  The synchronous-throw test passes for free: a throw inside the Promise
//  executor is caught by the constructor and becomes a rejection, so the
//  wrapper never explodes at the call site.
//  Wrong turn: `fn(...args, resolve)` looks identical and usually is — but
//  it also forwards any EXTRA callback arguments into resolve's ignored
//  slots, and it hands your resolve function to third-party code. Wrapping
//  it keeps the boundary yours.

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
  return (...args) =>
    new Promise((resolve) => {
      fn(...args, (value) => resolve(value));
    });
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
