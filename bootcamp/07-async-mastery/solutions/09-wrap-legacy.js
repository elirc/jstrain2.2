// ─────────────────────────────────────────────────────────────────────────
//  09 · load (wrap a legacy API) — SOLUTION                ★★☆ core
//  run: node 09-wrap-legacy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `new Promise((resolve, reject) => legacyLoad(id, {
//  onSuccess: resolve, onError: reject }))` is the whole adapter — the
//  handler functions ARE resolve and reject.
//  Two properties fall out for free. The executor runs inside a
//  try/catch, so legacyLoad's synchronous TypeError becomes a rejection
//  instead of an exception in the caller's face — one error channel
//  instead of two. And because a promise settles once, the late
//  onError for 'buggy' is a no-op; the value never changes back.
//  Wrong turn: wrapping the call in your own try/catch and calling
//  reject there. Harmless, but redundant — the constructor already does
//  exactly that.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

// A 2010-era loader: success/error handlers, sync throws, quirks.
export function legacyLoad(id, handlers) {
  if (typeof id !== 'string') throw new TypeError('id must be a string');
  setTimeout(() => {
    if (id === 'missing') {
      handlers.onError(new Error(`404 ${id}`));
      return;
    }
    handlers.onSuccess({ id, body: `data:${id}` });
    if (id === 'buggy') handlers.onError(new Error('late failure'));
  }, 5);
}

export function load(id) {
  return new Promise((resolve, reject) => {
    legacyLoad(id, { onSuccess: resolve, onError: reject });
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the loaded record', async () => {
  eq(await load('a'), { id: 'a', body: 'data:a' });
});

test('resolves with a different record per id', async () => {
  eq(await load('b'), { id: 'b', body: 'data:b' });
});

test('rejects when the loader reports an error', async () => {
  await rejects(load('missing'), '404 missing');
});

test('turns the synchronous throw into a rejection', async () => {
  const p = load(42);
  ok(p instanceof Promise, 'load must not throw at call time');
  await rejects(p, 'must be a string');
});

test('ignores a late error after success', async () => {
  const rec = await load('buggy');
  await sleep(20);
  eq(rec.id, 'buggy');
});
