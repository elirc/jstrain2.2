// ─────────────────────────────────────────────────────────────────────────
//  11 · AsyncLocalStorage — SOLUTION                        ★★★ stretch
//  run: node 11-async-local-storage.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two one-liners, and the whole lesson is in what Node
//  does around them. `run(value, fn)` marks the current async resource
//  with `value`; every promise, timer and I/O callback created while fn
//  is on the stack inherits that mark, and so do the ones THEY create.
//  So the context follows the causal chain, not the call stack — which
//  is why it survives `await` and `setTimeout` alike.
//  Nesting works because contexts stack: the inner run() shadows the
//  outer one and pops off when it returns. Concurrency works because the
//  two Promise.all branches are separate chains, each carrying its own
//  mark — the thing a module-level `let currentId` gets catastrophically
//  wrong the first time two requests overlap.
//  Wrong turn: `store.enterWith(id)` because it looks simpler. It has no
//  exit, so the value leaks into everything that runs after it on the
//  same chain. Use run() and let the scope close itself.
//  Second wrong turn: reaching for this to pass ordinary arguments. It
//  is for ambient facts — request id, tenant, trace span, user — not for
//  data a function genuinely needs in its signature.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export const requests = new AsyncLocalStorage();

export function withRequestId(id, fn) {
  return requests.run(id, fn);
}

export function currentRequestId() {
  return requests.getStore();
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
