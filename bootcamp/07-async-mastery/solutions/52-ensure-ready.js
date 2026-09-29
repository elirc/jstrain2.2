// ─────────────────────────────────────────────────────────────────────────
//  52 · createGate (ensureReady) — SOLUTION                 ★★☆ core
//  run: node 52-ensure-ready.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one variable holds the in-flight promise. If it is empty,
//  start init and store what it returns; otherwise hand back what you
//  already have. That is the entire single-flight pattern, and it works
//  because a promise is a value you can hold onto and hand to a hundred
//  callers — including after it has already settled.
//  Laziness comes free: nothing runs until the first `ensureReady()`,
//  which is why this beats top-level `const db = await connect()` in a
//  module. Import order stops mattering, and a process that never touches
//  the database never opens a connection.
//  The rejection branch clears the stored promise before rethrowing, so a
//  boot-time blip is retryable instead of poisoning the process for its
//  whole lifetime. Note the ordering: every caller already waiting still
//  sees the rejection; only the NEXT call starts a fresh attempt.
//  `isReady()` is set inside the fulfilment handler, never next to the
//  call — set it early and forty call sites will use a half-built pool.
//  Wrong turn: `let db; if (!db) db = await init();` at module scope.
//  Between the check and the assignment there is an await, so ten callers
//  all see `undefined` and you open ten pools.

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
  let running = null;
  let ready = false;

  return {
    ensureReady() {
      if (!running) {
        running = Promise.resolve(init()).then(
          (value) => {
            ready = true;
            return value;
          },
          (err) => {
            running = null; // a failed boot must stay retryable
            throw err;
          }
        );
      }
      return running;
    },

    isReady() {
      return ready;
    },
  };
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
