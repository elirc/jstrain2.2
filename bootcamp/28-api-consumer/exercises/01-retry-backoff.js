// ─────────────────────────────────────────────────────────────────────────
//  01 · retry with exponential backoff                          ★★☆ core
//  concepts: retries · exponential backoff · jitter
//  run: node 01-retry-backoff.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Networks fail transiently. A good client retries — but not instantly
//  and not forever, or it becomes a self-inflicted DDoS. Build
//  withRetry(fn, { retries, baseMs, sleep }):
//    · call fn(); if it resolves, return the value
//    · if it rejects, wait then retry, up to `retries` extra times
//    · the wait DOUBLES each attempt: baseMs, 2×baseMs, 4×baseMs, …
//      (exponential backoff)
//    · out of retries → reject with the LAST error
//    · `sleep(ms)` is injected so tests don't actually wait
//
//      withRetry(flaky, { retries: 3, baseMs: 10, sleep })
//        fails twice, succeeds on the 3rd call → resolves, waited 10 then 20
//
//  hint: a loop from attempt 0..retries. On failure, sleep(baseMs *
//  2**attempt) before the next go. Track the last error to re-throw.

import { test, eq, rejects } from '../../_lib/check.js';

export async function withRetry(fn, { retries, baseMs, sleep }) {
  throw new Error('TODO');
}

// ── a spy sleep that records waits instead of blocking ───────────────────
function fakeSleep() {
  const waits = [];
  const sleep = (ms) => { waits.push(ms); return Promise.resolve(); };
  sleep.waits = waits;
  return sleep;
}
// a fn that fails `failN` times, then succeeds
function flaky(failN, value = 'ok') {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    if (calls <= failN) throw new Error(`fail ${calls}`);
    return value;
  };
  fn.callCount = () => calls;
  return fn;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a call that succeeds first time never sleeps', async () => {
  const sleep = fakeSleep();
  const fn = flaky(0);
  eq(await withRetry(fn, { retries: 3, baseMs: 10, sleep }), 'ok');
  eq(sleep.waits, []);
  eq(fn.callCount(), 1);
});

test('it retries after a failure and eventually succeeds', async () => {
  const sleep = fakeSleep();
  const fn = flaky(2);
  eq(await withRetry(fn, { retries: 3, baseMs: 10, sleep }), 'ok');
  eq(fn.callCount(), 3); // 1 + 2 retries
});

test('the backoff doubles each attempt', async () => {
  const sleep = fakeSleep();
  const fn = flaky(3);
  await withRetry(fn, { retries: 5, baseMs: 10, sleep });
  eq(sleep.waits, [10, 20, 40]); // three waits before the 4th, winning call
});

test('it gives up after `retries` and throws the last error', async () => {
  const sleep = fakeSleep();
  const fn = flaky(10);
  await rejects(() => withRetry(fn, { retries: 2, baseMs: 5, sleep }), 'fail 3');
  eq(fn.callCount(), 3); // 1 + 2 retries, then stop
});

test('zero retries means one attempt, no sleeping', async () => {
  const sleep = fakeSleep();
  const fn = flaky(10);
  await rejects(() => withRetry(fn, { retries: 0, baseMs: 5, sleep }), 'fail 1');
  eq(sleep.waits, []);
  eq(fn.callCount(), 1);
});
