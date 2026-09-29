// ─────────────────────────────────────────────────────────────────────────
//  09 · load (wrap a legacy API)                           ★★☆ core
//  concepts: new Promise · adapters · settle-once
//  run: node 09-wrap-legacy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Not every old API is error-first. `legacyLoad` below takes a pair of
//  handlers, throws synchronously on bad input, and — for id 'buggy' —
//  reports success and THEN an error. Wrap it so callers get a promise.
//
//      await load('a')         → { id: 'a', body: 'data:a' }
//      await load('missing')   → rejects with Error('404 missing')
//      load(42)                → returns a rejected promise (no throw!)
//
//  This is the last time you should ever write `new Promise` around a
//  callback: from here on, everything speaks promises.
//
//  hint: the Promise executor turns a synchronous throw into a rejection

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
  throw new Error('TODO');
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
