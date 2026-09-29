// ─────────────────────────────────────────────────────────────────────────
//  08 · delayedValue · failAfter                           ★☆☆ warm-up
//  concepts: resolve · reject · rejection reasons
//  run: node 08-delayed-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two tiny builders you will reuse in later exercises as fake network
//  calls — one that succeeds, one that fails.
//
//      await delayedValue('pong', 20)      → 'pong'
//      await failAfter(20, 'timeout')      → throws Error('timeout')
//
//  delayedValue resolves with the value it was given. failAfter rejects
//  with a real `new Error(message)` — reject a string and you lose the
//  stack trace, and `instanceof Error` checks in callers stop working.

import { test, eq, ok, rejects } from '../../_lib/check.js';

const since = (t0) => Date.now() - t0;

export function delayedValue(value, ms) {
  throw new Error('TODO');
}

export function failAfter(ms, message) {
  throw new Error('TODO');
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
