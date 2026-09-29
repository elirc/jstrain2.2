// ─────────────────────────────────────────────────────────────────────────
//  15 · the async error bridge                             ★☆☆ warm-up
//  concepts: async/await · rejections · try/catch
//  run: node 15-async-error-bridge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A rejected promise and a thrown error are the same thing wearing
//  different clothes. `await` is the bridge: it turns a rejection back
//  into a throw, right there in your function, where an ordinary
//  try/catch can see it.
//
//  runSafely(task) awaits task() and reports the outcome as a value:
//
//      runSafely(async () => 'done')
//          → { ok: true, value: 'done' }
//      runSafely(() => Promise.reject(new Error('offline')))
//          → { ok: false, error: Error('offline') }
//      runSafely(async () => { throw new Error('kaboom'); })
//          → { ok: false, error: Error('kaboom') }
//      runSafely(() => { throw new Error('sync'); })
//          → { ok: false, error: Error('sync') }
//
//  Failures always arrive as real Errors, even when something rejected
//  with a bare string.
//
//  hint: the `await` has to be INSIDE the try, not before it.

import { test, eq, ok } from '../../_lib/check.js';

export async function runSafely(task) {
  throw new Error('TODO');
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
