// ─────────────────────────────────────────────────────────────────────────
//  39 · retryFailed (re-run only what broke)               ★★★ stretch
//  concepts: allSettled · selective retry · idempotence
//  run: node 39-retry-failures-only.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You pushed 200 events, 6 failed. Re-sending all 200 is not an option.
//  Build `retryFailed(items, worker, { attempts })`:
//
//      await retryFailed(['a', 'b'], send, { attempts: 3 })
//      → [{ status: 'fulfilled', value: 'sent:a' },
//         { status: 'rejected',  reason: Error }]
//
//  Rules:
//    · pass 1 runs `worker(item, index)` for EVERY item, concurrently
//    · each later pass re-runs ONLY the items that rejected — a success is
//      never re-run — and it stops early once nothing is failing
//    · at most `attempts` passes
//    · it RESOLVES (never rejects) with an allSettled-shaped array in
//      INPUT order; a rejected entry carries the LAST attempt's reason
//
//  hint: keep a results array the size of `items` and a list of the
//  indexes still to do. Each pass rewrites some of those slots.

import { test, eq, ok, spy } from '../../_lib/check.js';

// A worker whose failures you script: `{ a: 2 }` means item 'a' fails
// twice and then succeeds. Records every call and peak concurrency.
export function makeWorker(failuresByItem = {}) {
  const budget = { ...failuresByItem };
  const fn = spy((item) => {
    fn.running += 1;
    fn.peak = Math.max(fn.peak, fn.running);
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        fn.running -= 1;
        if (budget[item] > 0) {
          budget[item] -= 1;
          reject(new Error(`${item} failed (${budget[item]} left)`));
        } else {
          resolve(`sent:${item}`);
        }
      }, 10)
    );
  });
  fn.running = 0;
  fn.peak = 0;
  fn.items = () => fn.calls.map(([item]) => item);
  return fn;
}

export function retryFailed(items, worker, { attempts = 3 } = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one pass, one call per item, when nothing fails', async () => {
  const send = makeWorker();
  const out = await retryFailed(['a', 'b', 'c'], send);
  eq(
    out.map((r) => r.value),
    ['sent:a', 'sent:b', 'sent:c']
  );
  eq(send.callCount, 3);
});

test('results stay in input order', async () => {
  const send = makeWorker({ a: 1 });
  const out = await retryFailed(['a', 'b'], send, { attempts: 2 });
  eq(
    out.map((r) => r.status),
    ['fulfilled', 'fulfilled']
  );
  eq(out[0].value, 'sent:a');
});

test('retries only the items that failed', async () => {
  const send = makeWorker({ b: 1 });
  await retryFailed(['a', 'b', 'c'], send, { attempts: 3 });
  eq(send.items(), ['a', 'b', 'c', 'b']);
});

test('an item that succeeds on a later pass reports fulfilled', async () => {
  const send = makeWorker({ b: 2 });
  const out = await retryFailed(['a', 'b'], send, { attempts: 3 });
  eq(out[1], { status: 'fulfilled', value: 'sent:b' });
});

test('gives up after `attempts` passes with the last reason', async () => {
  const send = makeWorker({ b: 99 });
  const out = await retryFailed(['a', 'b'], send, { attempts: 3 });
  eq(out[1].status, 'rejected');
  eq(out[1].reason.message, 'b failed (96 left)');
  eq(send.items(), ['a', 'b', 'b', 'b']);
});

test('every pass runs its items concurrently', async () => {
  const send = makeWorker({ a: 1, b: 1, c: 1 });
  await retryFailed(['a', 'b', 'c'], send, { attempts: 2 });
  eq(send.peak, 3, 'a pass must not serialise its items');
  eq(send.callCount, 6);
});

test('an empty list resolves with an empty array', async () => {
  const send = makeWorker();
  eq(await retryFailed([], send), []);
  eq(send.callCount, 0);
});

test('hands the worker the original index', async () => {
  const send = makeWorker({ b: 1 });
  await retryFailed(['a', 'b'], send, { attempts: 2 });
  ok(send.calls.every(([item, index]) => ['a', 'b'][index] === item));
});
