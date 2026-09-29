// ─────────────────────────────────────────────────────────────────────────
//  36 · deferred (resolve from outside) — SOLUTION         ★☆☆ warm-up
//  run: node 36-deferred.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the Promise executor runs SYNCHRONOUSLY, so assignments
//  made inside it have already happened by the time the constructor
//  returns. That single fact is the whole trick: declare `resolve` and
//  `reject` outside, fill them in inside, and hand all three out.
//  `Promise.withResolvers()` is the standard-library version of exactly
//  this object, added because the hand-rolled one was in every codebase.
//  Reach for a deferred when the settling event is genuinely external —
//  an emitter, a socket, a user click. Do NOT reach for it to escape a
//  chain you could have returned: the "deferred antipattern" wraps an
//  existing promise in a new one and quietly drops its rejections.
//  Note the last test: promises settle ONCE. Extra resolve/reject calls
//  are silently ignored, which is why handing these functions to two
//  competing callbacks is safe rather than a race you must guard.
//  Wrong turn: `let resolve; new Promise(async (res) => ...)` — an async
//  executor swallows throws into a promise nobody sees.

import { test, eq, ok, rejects } from '../../_lib/check.js';

export function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function createDeferredNative() {
  const { promise, resolve, reject } = Promise.withResolvers();
  return { promise, resolve, reject };
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
