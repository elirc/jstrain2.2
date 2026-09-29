// ─────────────────────────────────────────────────────────────────────────
//  08 · CPU work in a Worker                                   ★★☆ core
//  concepts: worker_threads · eval workers · workerData · messages
//  run: node 08-worker-cpu.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `await` does not help with a tight loop. Awaiting only yields at an
//  I/O boundary, and a prime sieve has none — while it runs, your server
//  answers nobody. A Worker is a second JavaScript thread with its own
//  heap and its own event loop, so the loop runs THERE and the main
//  thread keeps serving.
//
//  Build the promise wrapper. PRIME_WORKER and BROKEN_WORKER are given:
//
//      await runWorker(PRIME_WORKER, 10)   → 4     (2, 3, 5, 7)
//      await runWorker(BROKEN_WORKER)      → REJECTS with 'worker exploded'
//      await countPrimes(100)              → 25
//
//  The worker reads its input from `workerData` and answers with exactly
//  one `postMessage`. Resolve on that message, reject on 'error', and do
//  not leave the thread running afterwards.
//
//  hint: new Worker(source, { eval: true, workerData }) — 'eval' means
//  "this string IS the program", not "load this file"

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { Worker } from 'node:worker_threads';

// Provided: counts the primes up to workerData, then reports.
export const PRIME_WORKER = `
  const { parentPort, workerData } = require('node:worker_threads');
  let count = 0;
  for (let n = 2; n <= workerData; n += 1) {
    let prime = true;
    for (let d = 2; d * d <= n; d += 1) {
      if (n % d === 0) { prime = false; break; }
    }
    if (prime) count += 1;
  }
  parentPort.postMessage(count);
`;

// Provided: a worker that dies on startup.
export const BROKEN_WORKER = `throw new Error('worker exploded');`;

export function runWorker(source, data) {
  throw new Error('TODO');
}

// Provided, once runWorker works.
export const countPrimes = (limit) => runWorker(PRIME_WORKER, limit);

// ──────────────────────────── tests ──────────────────────────────────────

test('counts the primes up to 10', async () => {
  eq(await countPrimes(10), 4);
});

test('counts the primes up to 100', async () => {
  eq(await countPrimes(100), 25);
});

test('answers 0 when there is nothing to count', async () => {
  const result = await countPrimes(1);
  eq(result, 0);
  ok(typeof result === 'number', 'the value crosses as a number, not text');
});

test('a worker that dies rejects with its error', async () => {
  await rejects(() => runWorker(BROKEN_WORKER), 'worker exploded');
});

test('two workers can be in flight at once', async () => {
  eq(await Promise.all([countPrimes(10), countPrimes(20)]), [4, 8]);
});
