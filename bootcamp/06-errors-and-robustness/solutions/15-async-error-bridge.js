// ─────────────────────────────────────────────────────────────────────────
//  15 · the async error bridge — SOLUTION                  ★☆☆ warm-up
//  run: node 15-async-error-bridge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one try/catch handles all three failure shapes, and that
//  is the point. `await task()` does two jobs — it calls task (so a
//  synchronous throw happens inside the try) and it awaits the result
//  (so a rejection is re-thrown inside the try too). An async function
//  that throws simply returns a rejected promise; there is no second
//  mechanism to learn.
//  The mirror-image bug is calling task() inside the try and returning
//  the promise WITHOUT awaiting it: the function leaves the try block
//  immediately, the rejection lands afterwards, and the catch never
//  runs. That is exercise 16.
//  `.catch()` on the promise would work equally well here; what you
//  cannot do is mix a try/catch with an un-awaited promise.

import { test, eq, ok } from '../../_lib/check.js';

export async function runSafely(task) {
  try {
    const value = await task();
    return { ok: true, value };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a resolved task becomes a success', async () => {
  eq(await runSafely(async () => 'done'), { ok: true, value: 'done' });
});

test('a rejected promise is caught by try/catch + await', async () => {
  const result = await runSafely(() => Promise.reject(new Error('offline')));
  eq(result.ok, false);
  eq(result.error.message, 'offline');
});

test('throwing inside an async function also rejects', async () => {
  const result = await runSafely(async () => {
    throw new Error('kaboom');
  });
  eq(result.ok, false);
  eq(result.error.message, 'kaboom');
});

test('a plain synchronous throw is caught too', async () => {
  const result = await runSafely(() => {
    throw new Error('sync');
  });
  eq(result.ok, false);
  eq(result.error.message, 'sync');
});

test('a non-Error rejection reason is normalized', async () => {
  const result = await runSafely(() => Promise.reject('just a string'));
  ok(result.error instanceof Error);
  eq(result.error.message, 'just a string');
});

test('a falsy resolved value is still a success', async () => {
  eq(await runSafely(async () => 0), { ok: true, value: 0 });
});
