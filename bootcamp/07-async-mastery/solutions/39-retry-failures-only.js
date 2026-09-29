// ─────────────────────────────────────────────────────────────────────────
//  39 · retryFailed (re-run only what broke) — SOLUTION    ★★★ stretch
//  run: node 39-retry-failures-only.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two data structures do all the work — a `results` array
//  the size of the input, and a `todo` list of INDEXES. Each pass runs
//  allSettled over the todo indexes, writes every outcome into its slot,
//  and rebuilds `todo` from the slots that rejected. When `todo` is empty
//  you are done, even if attempts remain.
//  Carrying indexes instead of items is what keeps the output positional:
//  the caller can zip results back onto the input without matching on
//  value, and duplicate items do not collide.
//  Because each pass overwrites the slot, a rejected entry naturally ends
//  up holding the LAST attempt's reason — the one that says why you gave
//  up, not the stale first one.
//  Real-world caveat worth saying out loud: this is only safe when the
//  worker is idempotent. A retry that half-succeeded the first time
//  (charged the card, then timed out) needs an idempotency key — that is
//  exercise 51.
//  Wrong turn: re-running `Promise.allSettled(items.map(worker))` from
//  scratch each pass. It re-sends the successes, which is the exact bug
//  the exercise exists to prevent.

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

export async function retryFailed(items, worker, { attempts = 3 } = {}) {
  const results = new Array(items.length);
  let todo = items.map((_, index) => index);

  for (let pass = 0; pass < attempts && todo.length > 0; pass += 1) {
    const settled = await Promise.allSettled(
      todo.map((index) => worker(items[index], index))
    );
    todo.forEach((index, slot) => {
      results[index] = settled[slot];
    });
    todo = todo.filter((index) => results[index].status === 'rejected');
  }

  return results;
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
