// ─────────────────────────────────────────────────────────────────────────
//  16 · forgot to await — SOLUTION                            ★★☆ core
//  run: node 16-forgot-to-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `return await task()` is the whole fix. Without the
//  await, the try block finishes the instant the promise is created; the
//  rejection happens later, on a different turn of the event loop, with
//  no catch anywhere near it. The async function then adopts that
//  rejected promise, so the failure reappears at the CALLER — exactly
//  where the author thought it had been handled.
//  observeLeak proves it: the leaky helper's promise rejects instead of
//  resolving to 'caught: ...'.
//  Why this bug survives code review: a synchronous throw from task()
//  happens during the call itself, still inside the try, so the catch
//  does fire. Tests with fake sync callbacks pass. Only real async work
//  reveals it.
//  In the wild the same mistake shows up as `arr.forEach(async ...)`,
//  a missing await on a fire-and-forget write, and an un-awaited call
//  in a finally block. Lint rule: no-floating-promises.

import { test, eq } from '../../_lib/check.js';

export async function observeLeak(task) {
  try {
    return `returned: ${await leakyCatch(task)}`;
  } catch (err) {
    return `rejected: ${err.message}`;
  }
}

export async function safeCatch(task) {
  try {
    return await task();
  } catch (err) {
    return `caught: ${err.message}`;
  }
}

// ── given: the bug. Read it, don't repair it. ────────────────────────────

export async function leakyCatch(task) {
  try {
    return task(); // ← no await: this promise escapes the try block
  } catch (err) {
    return `caught: ${err.message}`;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('safeCatch returns the value when the task resolves', async () => {
  eq(await safeCatch(async () => 'fine'), 'fine');
});

test('safeCatch catches a rejected promise', async () => {
  eq(
    await safeCatch(() => Promise.reject(new Error('offline'))),
    'caught: offline'
  );
});

test('safeCatch catches a synchronous throw too', async () => {
  eq(
    await safeCatch(() => {
      throw new Error('sync');
    }),
    'caught: sync'
  );
});

test('the leaky version never catches an async failure', async () => {
  eq(
    await observeLeak(() => Promise.reject(new Error('offline'))),
    'rejected: offline'
  );
});

test('the leaky version looks fine when nothing fails', async () => {
  eq(await observeLeak(async () => 'fine'), 'returned: fine');
});

test('the leak really is a rejection, not a returned string', async () => {
  eq(await safeCatch(async () => 'fine'), 'fine');
  let landed = 'never rejected';
  try {
    await leakyCatch(() => Promise.reject(new Error('offline')));
  } catch (err) {
    landed = err.message;
  }
  eq(landed, 'offline');
});

test('the leak hides in tests because sync throws ARE caught', async () => {
  eq(
    await safeCatch(() => {
      throw new Error('sync');
    }),
    'caught: sync'
  );
  eq(
    await leakyCatch(() => {
      throw new Error('sync');
    }),
    'caught: sync'
  );
});
