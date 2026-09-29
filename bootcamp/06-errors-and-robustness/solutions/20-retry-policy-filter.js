// ─────────────────────────────────────────────────────────────────────────
//  20 · retry only what is worth retrying — SOLUTION           ★★☆ core
//  run: node 20-retry-policy-filter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the loop counts TOTAL attempts, which reads better than
//  "extras" the moment a policy object is involved — `attempts: 3` is
//  what an on-call engineer expects to mean three calls.
//  Two guards do the real work. `if (!isRetryable(err)) throw err;`
//  makes a permanent failure cost exactly one call. `if (attempt <
//  attempts) onRetry?.(...)` keeps the callback honest: it fires when
//  another call is actually coming, so a log line that says "retrying"
//  is never a lie. The final `throw lastError` re-throws the real
//  failure rather than a fresh 'gave up' Error that would erase it.
//  Note what is missing: a sleep. Real policies back off (and jitter)
//  between attempts; the shape is the same, with `await sleep(delay)`
//  next to onRetry, and a clock you inject so tests stay fast.
//  Classic wrong turn: retrying a 400 or a ValidationError. It cannot
//  succeed, and the retries hide the real latency of the failure.

import { test, eq, ok, spy } from '../../_lib/check.js';

export async function retryOn(fn, options = {}) {
  const { attempts = 3, isRetryable = () => true, onRetry } = options;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) throw err;
      if (attempt < attempts) onRetry?.(err, attempt);
    }
  }
  throw lastError;
}

// ── given: test fixtures & helpers ───────────────────────────────────────

// an Error that looks like an HTTP failure
const httpError = (status) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

// fails `failures` times with makeError(n), then resolves with `value`
function flakyAsync(failures, makeError, value) {
  let calls = 0;
  return async () => {
    calls += 1;
    if (calls <= failures) throw makeError(calls);
    return value;
  };
}

// returns the error an async fn rejected with, so a test can inspect it
async function rejectedBy(fn) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to reject, but it resolved');
}

const serverIsBusy = (err) => err.status >= 500;

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the value without retrying when it works', async () => {
  const fn = spy(async () => 'connected');
  eq(await retryOn(fn, { isRetryable: serverIsBusy }), 'connected');
  eq(fn.callCount, 1);
});

test('retries a retryable failure, then returns the value', async () => {
  const fn = spy(flakyAsync(2, () => httpError(503), 'connected'));
  const options = { attempts: 3, isRetryable: serverIsBusy };
  eq(await retryOn(fn, options), 'connected');
  eq(fn.callCount, 3);
});

test('a non-retryable failure escapes on the first attempt', async () => {
  const fn = spy(flakyAsync(99, () => httpError(400), 'never'));
  const err = await rejectedBy(() =>
    retryOn(fn, { attempts: 5, isRetryable: serverIsBusy })
  );
  eq(err.message, 'HTTP 400');
  eq(fn.callCount, 1);
});

test('onRetry fires for retries only, never for the give-up', async () => {
  const onRetry = spy();
  await rejectedBy(() =>
    retryOn(flakyAsync(99, () => httpError(503), 'never'), {
      attempts: 3,
      isRetryable: serverIsBusy,
      onRetry,
    })
  );
  eq(onRetry.callCount, 2);
  eq(onRetry.calls.map((args) => args[1]), [1, 2]);
});

test('runs out of attempts and throws the LAST error', async () => {
  const err = await rejectedBy(() =>
    retryOn(flakyAsync(99, (n) => httpError(500 + n), 'never'), {
      attempts: 3,
      isRetryable: serverIsBusy,
    })
  );
  eq(err.message, 'HTTP 503');
});

test('attempts: 1 means one call and no retry', async () => {
  const fn = spy(flakyAsync(99, () => httpError(503), 'never'));
  await rejectedBy(() =>
    retryOn(fn, { attempts: 1, isRetryable: serverIsBusy })
  );
  eq(fn.callCount, 1);
});

test('isRetryable receives the real error object', async () => {
  const isRetryable = spy(() => false);
  await rejectedBy(() =>
    retryOn(flakyAsync(1, () => httpError(418), 'never'), { isRetryable })
  );
  eq(isRetryable.callCount, 1);
  eq(isRetryable.calls[0][0].status, 418);
  ok(isRetryable.calls[0][0] instanceof Error);
});

test('the default policy retries everything', async () => {
  const fn = spy(flakyAsync(2, () => httpError(400), 'connected'));
  eq(await retryOn(fn), 'connected');
  eq(fn.callCount, 3);
});
