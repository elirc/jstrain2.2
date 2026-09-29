// ─────────────────────────────────────────────────────────────────────────
//  52 · createGate (ensureReady, run init once)             ★★☆ core
//  concepts: lazy init · single flight · module state
//  run: node 52-ensure-ready.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `getDb()` is called from forty places during boot and the connection
//  pool must be built exactly once — but not until somebody actually
//  needs it. Build `createGate(init)`:
//
//      const gate = createGate(connect);
//      gate.isReady()                       → false, connect not called
//      await Promise.all([gate.ensureReady(),
//                         gate.ensureReady()])   → connect ran ONCE
//      gate.isReady()                       → true
//
//  Rules:
//    · `init` does not run until the first `ensureReady()` — lazy, not
//      eager
//    · however many callers pile in, concurrently or later, `init` runs
//      at most once and everyone gets its value
//    · `isReady()` is false until init RESOLVES, true afterwards
//    · if `init` rejects, the failure is not cached: the next
//      `ensureReady()` tries again
//
//  hint: store the in-flight promise in a variable, not the value. The
//  whole point is that the second caller arrives while the first is still
//  connecting.

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';

// A connect() that fails its first `failures` attempts.
export function makeInit({ failures = 0 } = {}) {
  const fn = spy(
    () =>
      new Promise((resolve, reject) =>
        setTimeout(() => {
          fn.tries += 1;
          if (fn.tries <= failures) reject(new Error(`connect failed`));
          else resolve({ pool: fn.tries });
        }, 15)
      )
  );
  fn.tries = 0;
  return fn;
}

export function createGate(init) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('does not run init until the first ensureReady', async () => {
  const init = makeInit();
  const gate = createGate(init);
  eq(init.callCount, 0, 'creating the gate must not connect');
  eq(gate.isReady(), false);
  await gate.ensureReady();
  eq(init.callCount, 1);
});

test('ten concurrent callers run init once', async () => {
  const init = makeInit();
  const gate = createGate(init);
  const values = await Promise.all(
    Array.from({ length: 10 }, () => gate.ensureReady())
  );
  eq(init.callCount, 1);
  eq(values[0], { pool: 1 });
  ok(values.every((v) => v === values[0]), 'everyone gets the same object');
});

test('a later call returns the value without re-running init', async () => {
  const init = makeInit();
  const gate = createGate(init);
  const first = await gate.ensureReady();
  const second = await gate.ensureReady();
  ok(first === second);
  eq(init.callCount, 1);
});

test('isReady flips only once init has resolved', async () => {
  const init = makeInit();
  const gate = createGate(init);
  const pending = gate.ensureReady();
  eq(gate.isReady(), false, 'still connecting');
  await pending;
  eq(gate.isReady(), true);
});

test('a failed init rejects every waiting caller', async () => {
  const init = makeInit({ failures: 99 });
  const gate = createGate(init);
  const a = gate.ensureReady();
  const b = gate.ensureReady();
  await rejects(a, 'connect failed');
  await rejects(b, 'connect failed');
  eq(init.callCount, 1);
  eq(gate.isReady(), false);
});

test('a failed init is retried by the next ensureReady', async () => {
  const init = makeInit({ failures: 1 });
  const gate = createGate(init);
  await rejects(gate.ensureReady(), 'connect failed');
  eq(await gate.ensureReady(), { pool: 2 });
  eq(init.callCount, 2);
  eq(gate.isReady(), true);
  await gate.ensureReady();
  eq(init.callCount, 2, 'and now it stays ready');
});
