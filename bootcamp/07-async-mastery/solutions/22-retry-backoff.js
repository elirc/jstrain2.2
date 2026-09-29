// ─────────────────────────────────────────────────────────────────────────
//  22 · retry (with exponential backoff) — SOLUTION        ★★☆ core
//  run: node 22-retry-backoff.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a plain for-loop with try/catch. `return await fn()`
//  inside the try exits the loop on the first success; the catch stores
//  the error and, if attempts remain, awaits a growing delay before
//  looping. After the loop, throw the error you kept.
//  Because `await fn()` is inside the try, a synchronous throw and a
//  rejected promise are handled by the same catch — one error path.
//  Doubling the wait (10, 20, 40) is exponential backoff: it turns a
//  retry storm into a trickle. Real clients add jitter — a random
//  fraction of the delay — so a thousand clients do not resynchronise.
//  Wrong turn: waiting after the final attempt, or throwing the FIRST
//  error. Callers want the most recent failure; it is the one that
//  describes why you finally gave up.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

// Fails the first `failures` calls, then resolves with 'ok'.
export function makeFlaky(failures, { sync = false } = {}) {
  const fn = () => {
    fn.calls += 1;
    if (fn.calls > failures) return Promise.resolve('ok');
    const err = new Error(`attempt ${fn.calls} failed`);
    if (sync) throw err;
    return Promise.reject(err);
  };
  fn.calls = 0;
  return fn;
}

export async function retry(fn, times, baseMs = 10) {
  let lastError;
  for (let attempt = 1; attempt <= times; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < times) {
        await sleep(baseMs * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the value without retrying when it works', async () => {
  const fn = makeFlaky(0);
  eq(await retry(fn, 3), 'ok');
  eq(fn.calls, 1);
});

test('retries until it succeeds', async () => {
  const fn = makeFlaky(2);
  eq(await retry(fn, 3), 'ok');
  eq(fn.calls, 3);
});

test('gives up after the allowed number of attempts', async () => {
  const fn = makeFlaky(99);
  await rejects(retry(fn, 3), 'attempt 3 failed');
  eq(fn.calls, 3);
});

test('rejects with the last error, not the first', async () => {
  const fn = makeFlaky(99);
  const err = await retry(fn, 2).then(
    () => null,
    (e) => e
  );
  eq(err.message, 'attempt 2 failed');
});

test('backs off between attempts', async () => {
  const fn = makeFlaky(99);
  const t0 = Date.now();
  await rejects(retry(fn, 3, 10), 'failed');
  ok(Date.now() - t0 >= 25, 'expected waits of about 10ms then 20ms');
});

test('retries a synchronous throw too', async () => {
  const fn = makeFlaky(1, { sync: true });
  eq(await retry(fn, 3), 'ok');
  eq(fn.calls, 2);
});
