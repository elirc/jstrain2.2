// ─────────────────────────────────────────────────────────────────────────
//  36 · deferred (resolve from outside)                    ★☆☆ warm-up
//  concepts: Promise constructor · Promise.withResolvers
//  run: node 36-deferred.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Sometimes the thing that settles a promise is nowhere near the code
//  that created it: a socket handshake, a modal that resolves when the
//  user finally clicks. A "deferred" hands the controls out:
//
//      const d = createDeferred();
//      d.promise.then((v) => console.log(v));
//      d.resolve('later');            → logs 'later'
//
//  Build it twice. `createDeferred` captures the executor's two functions
//  by hand. `createDeferredNative` does the same job with Node's built-in
//  `Promise.withResolvers()`, which exists precisely because everyone kept
//  writing the first one. Both return `{ promise, resolve, reject }`.

import { test, eq, ok, rejects } from '../../_lib/check.js';

export function createDeferred() {
  throw new Error('TODO');
}

export function createDeferredNative() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('hands back a promise and two functions', () => {
  const d = createDeferred();
  ok(d.promise instanceof Promise);
  ok(typeof d.resolve === 'function' && typeof d.reject === 'function');
});

test('resolving later settles the promise with that value', async () => {
  const d = createDeferred();
  setTimeout(() => d.resolve({ ok: true }), 10);
  eq(await d.promise, { ok: true });
});

test('rejecting later rejects the promise', async () => {
  const d = createDeferred();
  setTimeout(() => d.reject(new Error('handshake failed')), 10);
  await rejects(d.promise, 'handshake failed');
});

test('settles once — a second resolve is ignored', async () => {
  const d = createDeferred();
  d.resolve('first');
  d.resolve('second');
  d.reject(new Error('too late'));
  eq(await d.promise, 'first');
});

test('two deferreds are independent', async () => {
  const a = createDeferred();
  const b = createDeferred();
  b.resolve('b');
  a.resolve('a');
  eq(await Promise.all([a.promise, b.promise]), ['a', 'b']);
});

test('the withResolvers version has the same shape', () => {
  const d = createDeferredNative();
  ok(d.promise instanceof Promise);
  ok(typeof d.resolve === 'function' && typeof d.reject === 'function');
});

test('the withResolvers version resolves and rejects too', async () => {
  const good = createDeferredNative();
  const bad = createDeferredNative();
  good.resolve(7);
  bad.reject(new Error('nope'));
  eq(await good.promise, 7);
  await rejects(bad.promise, 'nope');
});
