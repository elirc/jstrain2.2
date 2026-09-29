// ─────────────────────────────────────────────────────────────────────────
//  01 · retry with exponential backoff — SOLUTION               ★★☆ core
//  concepts: retries · exponential backoff · jitter
//  run: node 01-retry-backoff.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  A retry loop with a doubling wait. Attempt 0 runs immediately; each
//  failure sleeps baseMs × 2**attempt before the next try, so a
//  struggling server gets geometrically more breathing room instead of
//  a fixed-rate hammering. After `retries` extra attempts we stop and
//  re-throw the LAST error — the caller still sees a real failure, just
//  after we've given the transient one every reasonable chance.
//  Injecting sleep is the testability move: the same code that waits
//  real milliseconds in production waits a recorded no-op in tests, so
//  we can assert the backoff schedule ([10, 20, 40]) without the clock.
//  In production add JITTER — a random fraction of the delay — so a
//  thousand clients that failed at the same instant don't all retry in
//  lockstep (the "thundering herd"). And retry ONLY idempotent or
//  safe-to-repeat operations, or pair it with an idempotency key
//  (exercise 04) so a retried POST doesn't charge twice.
//  Classic wrong turns: retrying on non-transient errors (a 400 will
//  never succeed — you just wait longer to fail), no cap (infinite
//  retries), and linear/constant delay (no relief for the server).

import { test, eq, rejects } from '../../_lib/check.js';

export async function withRetry(fn, { retries, baseMs, sleep }) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(baseMs * 2 ** attempt);
    }
  }
  throw lastError;
}

// ── a spy sleep that records waits instead of blocking ───────────────────
function fakeSleep() {
  const waits = [];
  const sleep = (ms) => { waits.push(ms); return Promise.resolve(); };
  sleep.waits = waits;
  return sleep;
}
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
  eq(fn.callCount(), 3);
});

test('the backoff doubles each attempt', async () => {
  const sleep = fakeSleep();
  const fn = flaky(3);
  await withRetry(fn, { retries: 5, baseMs: 10, sleep });
  eq(sleep.waits, [10, 20, 40]);
});

test('it gives up after `retries` and throws the last error', async () => {
  const sleep = fakeSleep();
  const fn = flaky(10);
  await rejects(() => withRetry(fn, { retries: 2, baseMs: 5, sleep }), 'fail 3');
  eq(fn.callCount(), 3);
});

test('zero retries means one attempt, no sleeping', async () => {
  const sleep = fakeSleep();
  const fn = flaky(10);
  await rejects(() => withRetry(fn, { retries: 0, baseMs: 5, sleep }), 'fail 1');
  eq(sleep.waits, []);
  eq(fn.callCount(), 1);
});
