// ─────────────────────────────────────────────────────────────────────────
//  26 · createBatcher (collect a tick of calls) — SOLUTION ★★★ stretch
//  run: node 26-batch-requests.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each call pushes { id, resolve, reject } onto a pending
//  list and returns a promise. The FIRST id to land on an empty list
//  schedules the flush with queueMicrotask; every later call in that
//  same synchronous run just joins the list.
//  flush swaps the list out first (`const batch = pending; pending = [];`)
//  so calls arriving while the loader is in flight start a fresh batch,
//  then calls the loader once and fans the results back out by index.
//  queueMicrotask runs after the current synchronous run finishes but
//  before any timer, so batching costs zero latency. setTimeout(...,0)
//  would work too and would batch more aggressively — one tick of delay
//  in exchange for bigger batches.
//  Wrong turn: scheduling a flush on every call. You get one loader call
//  per id, batched into nothing.

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';

const DB = { a: 1, b: 2, c: 3, d: 4 };

export const loadMany = spy(
  (ids) =>
    new Promise((resolve) =>
      setTimeout(() => resolve(ids.map((id) => DB[id] ?? null)), 5)
    )
);

export const resetLoader = () => {
  loadMany.calls.length = 0;
  loadMany.returns.length = 0;
  loadMany.callCount = 0;
};

export const failingLoader = () => Promise.reject(new Error('batch failed'));

export function createBatcher(loader) {
  let pending = [];

  const flush = () => {
    const batch = pending;
    pending = [];
    Promise.resolve(loader(batch.map((entry) => entry.id))).then(
      (values) => batch.forEach((entry, i) => entry.resolve(values[i])),
      (err) => batch.forEach((entry) => entry.reject(err))
    );
  };

  return (id) =>
    new Promise((resolve, reject) => {
      pending.push({ id, resolve, reject });
      if (pending.length === 1) queueMicrotask(flush);
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('gives every caller its own value', async () => {
  resetLoader();
  const get = createBatcher(loadMany);
  eq(await Promise.all([get('a'), get('b'), get('c')]), [1, 2, 3]);
});

test('calls the loader once for a tick of calls', async () => {
  resetLoader();
  const get = createBatcher(loadMany);
  await Promise.all([get('a'), get('b'), get('c')]);
  eq(loadMany.callCount, 1);
});

test('hands the loader all the ids at once, in call order', async () => {
  resetLoader();
  const get = createBatcher(loadMany);
  await Promise.all([get('b'), get('a')]);
  eq(loadMany.calls[0][0], ['b', 'a']);
});

test('a single call still works', async () => {
  resetLoader();
  const get = createBatcher(loadMany);
  eq(await get('d'), 4);
  eq(loadMany.callCount, 1);
});

test('calls made after an await form a new batch', async () => {
  resetLoader();
  const get = createBatcher(loadMany);
  await get('a');
  await sleep(5);
  await get('b');
  eq(loadMany.callCount, 2);
});

test('a failing batch rejects every caller in it', async () => {
  const get = createBatcher(failingLoader);
  const a = get('a');
  const b = get('b');
  await Promise.all([rejects(a, 'batch failed'), rejects(b, 'batch failed')]);
  ok(true);
});
