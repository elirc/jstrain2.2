// ─────────────────────────────────────────────────────────────────────────
//  10 · runInWorker(fnSource, arg) — SOLUTION               ★★★ stretch
//  run: node 10-run-in-worker.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the worker program is a template — wrap the source in
//  parentheses so `(n) => n * 3` and `function sq(n) {…}` both evaluate
//  to a value, call it with workerData, and post a tagged envelope.
//  Promise.resolve(fn(…)) means an async function works for free, and
//  the two-argument .then() turns "it returned" and "it threw" into two
//  different envelopes. Errors do not survive a structured clone with
//  their prototype intact, so send the message text and rebuild an Error
//  on this side.
//  Two failure modes, two handlers: a throw INSIDE fn arrives as an
//  envelope; a source that will not even parse never gets that far and
//  surfaces on the worker's 'error' event as a SyntaxError. Handle both
//  or the bad-source case hangs forever.
//  Cost check before you reach for this: a worker is ~10–50 ms of
//  startup plus a clone of the argument each way. Below roughly a
//  millisecond of real work it is pure loss — inline the call. Above a
//  few hundred milliseconds it is the difference between a responsive
//  process and a frozen one.
//  Wrong turn: passing a real function and hoping. postMessage clones
//  data, not code; you get a DataCloneError, which is the runtime
//  telling you that a closure cannot be moved between heaps.

import { test, eq, rejects } from '../../_lib/check.js';
import { Worker } from 'node:worker_threads';

export function runInWorker(fnSource, arg) {
  const program = `
    const { parentPort, workerData } = require('node:worker_threads');
    const fn = (${fnSource});
    Promise.resolve(fn(workerData)).then(
      (value) => parentPort.postMessage({ ok: true, value }),
      (error) => parentPort.postMessage({
        ok: false,
        message: String((error && error.message) || error),
      })
    );
  `;
  return new Promise((resolve, reject) => {
    const worker = new Worker(program, { eval: true, workerData: arg });
    worker.once('message', (envelope) => {
      worker.terminate();
      if (envelope.ok) resolve(envelope.value);
      else reject(new Error(envelope.message));
    });
    worker.once('error', reject); // never parsed, or died before answering
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('runs an arrow function over the argument', async () => {
  eq(await runInWorker('(n) => n * 3', 7), 21);
});

test('accepts a function expression as the source', async () => {
  eq(await runInWorker('function square(n) { return n * n; }', 6), 36);
});

test('objects cross in both directions as structured clones', async () => {
  eq(
    await runInWorker('(user) => ({ shout: user.name.toUpperCase() })', {
      name: 'ada',
    }),
    { shout: 'ADA' }
  );
});

test('a throw inside the worker becomes a rejection out here', async () => {
  await rejects(
    () => runInWorker("() => { throw new Error('inside boom'); }"),
    'inside boom'
  );
});

test('source that is not valid JavaScript rejects too', async () => {
  await rejects(() => runInWorker('@@@', 1));
});
