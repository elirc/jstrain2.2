// ─────────────────────────────────────────────────────────────────────────
//  08 · delayedValue · failAfter — SOLUTION                ★☆☆ warm-up
//  run: node 08-delayed-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: same executor shape as delay, but now both settle
//  functions are in play: resolve(value) fulfils with a value, and
//  reject(reason) rejects with one. The pair is the whole promise API.
//  Two habits worth locking in. Reject with an Error object, never a
//  string — `catch (e) { e.message }` and stack traces depend on it.
//  And note that a rejected promise is not an exception yet: nothing
//  throws until someone awaits it or attaches .catch.

import { test, eq, ok, rejects } from '../../_lib/check.js';

const since = (t0) => Date.now() - t0;

export function delayedValue(value, ms) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function failAfter(ms, message) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('delayedValue resolves with the value it was given', async () => {
  eq(await delayedValue('pong', 5), 'pong');
});

test('delayedValue passes objects through untouched', async () => {
  const obj = { id: 1 };
  ok((await delayedValue(obj, 5)) === obj, 'same reference expected');
});

test('delayedValue actually waits', async () => {
  const t0 = Date.now();
  await delayedValue(1, 30);
  ok(since(t0) >= 25, `waited only ${since(t0)}ms`);
});

test('failAfter rejects with the message given', async () => {
  await rejects(failAfter(5, 'timeout'), 'timeout');
});

test('failAfter rejects with an Error, not a string', async () => {
  const reason = await failAfter(5, 'nope').then(
    () => null,
    (e) => e
  );
  ok(reason instanceof Error, `rejected with ${typeof reason}`);
});

test('failAfter stays pending until its timer fires', async () => {
  let done = false;
  const p = failAfter(15, 'late').catch(() => {
    done = true;
  });
  ok(done === false, 'must not reject synchronously');
  await p;
  ok(done);
});
