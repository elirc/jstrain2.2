// ─────────────────────────────────────────────────────────────────────────
//  10 · runInWorker(fnSource, arg)                          ★★★ stretch
//  concepts: code as data · structured clone · worker errors
//  run: node 10-run-in-worker.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The helper you actually want: "run this function over there, give me
//  a promise". You cannot postMessage a function — closures do not
//  survive a structured clone — so the function crosses as SOURCE TEXT
//  and the argument crosses as data.
//
//      await runInWorker('(n) => n * 3', 7)                     → 21
//      await runInWorker('function sq(n) { return n * n; }', 6) → 36
//      await runInWorker('(u) => u.name.toUpperCase()', { name: 'ada' })
//                                                              → 'ADA'
//      await runInWorker("() => { throw new Error('nope'); }")  → REJECTS
//
//  Build a worker program that evaluates the source into a function,
//  calls it with workerData, and reports back. Errors on that side have
//  to be converted into a rejection on this side.
//
//  hint: `const fn = (${fnSource});` — the parentheses are what let a
//  bare arrow or a function expression be used as a value. Send back a
//  tagged envelope like { ok, value } / { ok, message } so a thrown
//  error and a returned value never look alike.

import { test, eq, rejects } from '../../_lib/check.js';
import { Worker } from 'node:worker_threads';

export function runInWorker(fnSource, arg) {
  throw new Error('TODO');
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
