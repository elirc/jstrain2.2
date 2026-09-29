// ─────────────────────────────────────────────────────────────────────────
//  26 · createBatcher (collect a tick of calls)            ★★★ stretch
//  concepts: microtask scheduling · deferreds · request coalescing
//  run: node 26-batch-requests.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Fifty components each ask for one user by id and you get fifty HTTP
//  calls. Collect every call made in the same tick and make ONE call —
//  this is how DataLoader kills the N+1 query problem.
//
//      const get = createBatcher(loadMany);
//      const [a, b] = await Promise.all([get('a'), get('b')]);
//      → loadMany was called once, with ['a', 'b']
//
//  loadMany(ids) returns a promise for an array of values lined up with
//  the ids it was given. Each caller must get its own value. Calls made
//  after an await belong to a NEW batch, and if loadMany rejects, every
//  caller in that batch rejects with the same error.
//
//  hint: queueMicrotask(flush) when the first id joins an empty batch

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
  throw new Error('TODO');
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
