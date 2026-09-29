// ─────────────────────────────────────────────────────────────────────────
//  22 · retry (with exponential backoff)                   ★★☆ core
//  concepts: loops with await · backoff · last-error semantics
//  run: node 22-retry-backoff.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Networks fail for a second and then work. Retry the operation, but
//  back off so you do not hammer a struggling server.
//
//      await retry(flaky, 3)      → the value, if any attempt succeeds
//      await retry(alwaysFails, 3) → rejects with the LAST error
//
//  `retry(fn, times, baseMs = 10)` calls fn() up to `times` times total
//  (not times + 1). Between attempt n and n + 1 it waits
//  baseMs * 2 ** (n - 1): 10ms, then 20ms, then 40ms. No wait after the
//  final failure — give up immediately. A synchronous throw from fn
//  counts as a failed attempt too.
//
//  hint: a for-loop with try/catch around `return await fn()`

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

export function retry(fn, times, baseMs = 10) {
  throw new Error('TODO');
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
