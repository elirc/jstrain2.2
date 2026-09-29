// ─────────────────────────────────────────────────────────────────────────
//  11 · AsyncLocalStorage                                   ★★★ stretch
//  concepts: node:async_hooks · implicit context · request scoping
//  run: node 11-async-local-storage.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every log line wants the request id. Threading `requestId` through
//  handler → service → repository → logger poisons a dozen signatures
//  with a parameter none of them care about, and a module-level
//  `let currentId` is wrong the instant two requests overlap.
//
//  AsyncLocalStorage gives you a variable that follows the async call
//  chain instead of the call stack:
//
//      await withRequestId('r-1', async () => {
//        await loadUser();          // three awaits deep…
//      });
//      currentRequestId()           → 'r-1' in there, undefined out here
//
//  Two requests running at once must not see each other's id.
//
//  hint: `store.run(value, fn)` opens a context and returns whatever fn
//  returns; `store.getStore()` reads it from anywhere inside

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export const requests = new AsyncLocalStorage();

export function withRequestId(id, fn) {
  throw new Error('TODO');
}

export function currentRequestId() {
  throw new Error('TODO');
}

// Provided: two layers of async code that never take an id parameter.
async function loadUser() {
  await sleep(5);
  return `user@${currentRequestId()}`;
}

async function handleRequest() {
  await sleep(5);
  return loadUser();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('there is no request id outside a request', () => {
  eq(currentRequestId(), undefined);
});

test('the id is readable inside the request', async () => {
  eq(await withRequestId('r-1', async () => currentRequestId()), 'r-1');
});

test('the id survives awaits, several calls deep', async () => {
  eq(await withRequestId('r-2', handleRequest), 'user@r-2');
});

test('two concurrent requests keep separate ids', async () => {
  const [first, second] = await Promise.all([
    withRequestId('r-a', handleRequest),
    withRequestId('r-b', handleRequest),
  ]);
  eq(first, 'user@r-a');
  eq(second, 'user@r-b');
});

test('a nested request shadows the outer one, then restores it', async () => {
  const seen = await withRequestId('outer', async () => {
    const inner = await withRequestId('inner', async () => currentRequestId());
    return [inner, currentRequestId()];
  });
  eq(seen, ['inner', 'outer']);
});

test('the id is still there inside a timer callback', async () => {
  const id = await withRequestId(
    'r-timer',
    () => new Promise((resolve) => setTimeout(() => resolve(currentRequestId()), 10))
  );
  eq(id, 'r-timer');
});

test('withRequestId hands back what fn returns, and lets throws out', async () => {
  eq(await withRequestId('r-3', async () => 42), 42);
  await rejects(
    () => withRequestId('r-4', async () => {
      throw new Error('handler failed');
    }),
    'handler failed'
  );
  ok(currentRequestId() === undefined, 'the context closes again after');
});
