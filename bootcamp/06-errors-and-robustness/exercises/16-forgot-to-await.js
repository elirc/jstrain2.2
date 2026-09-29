// ─────────────────────────────────────────────────────────────────────────
//  16 · forgot to await                                       ★★☆ core
//  concepts: floating promises · try/catch scope · async traps
//  run: node 16-forgot-to-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `leakyCatch` below is real code from a real outage. It looks like it
//  handles failure. It does not: `return task()` leaves the try block
//  before the promise settles, so the rejection arrives when the catch
//  is long gone. Worse, it still catches SYNCHRONOUS throws — so it
//  works in the unit test and fails in production.
//
//  Do not fix leakyCatch. Write two functions:
//
//    observeLeak(task) — call leakyCatch and report what really happens
//        observeLeak(() => Promise.reject(new Error('offline')))
//            → 'rejected: offline'
//        observeLeak(async () => 'fine')  → 'returned: fine'
//
//    safeCatch(task) — the version that actually catches
//        safeCatch(async () => 'fine')    → 'fine'
//        safeCatch(() => Promise.reject(new Error('offline')))
//            → 'caught: offline'
//
//  hint: one keyword separates the two — and it belongs on the `return`.

import { test, eq } from '../../_lib/check.js';

export async function observeLeak(task) {
  throw new Error('TODO');
}

export async function safeCatch(task) {
  throw new Error('TODO');
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
