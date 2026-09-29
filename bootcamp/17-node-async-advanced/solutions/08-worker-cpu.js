// ─────────────────────────────────────────────────────────────────────────
//  08 · CPU work in a Worker — SOLUTION                        ★★☆ core
//  run: node 08-worker-cpu.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three events, one promise. 'message' is the answer,
//  'error' is a throw that escaped the worker, and 'exit' is the
//  backstop for a worker that died without either — without that last
//  listener a crashed worker leaves your promise pending forever. A
//  promise settles once, so calling reject() after resolve() (which the
//  exit handler will do, since terminate() exits with code 1) is a
//  harmless no-op.
//  terminate() after the answer matters: a Worker holds the event loop
//  open exactly like an unclosed socket, so a program that forgets it
//  prints its result and then hangs.
//  When is this worth it? A Worker costs tens of milliseconds to start
//  and every message is a structured clone, so it loses badly on small
//  jobs — countPrimes(10) is far slower in a worker than inline. It wins
//  when the computation is long enough to dwarf that startup and would
//  otherwise block the main thread: parsing, hashing, image work,
//  compiling. Wrong turn: a worker per request. Pool them (see 09).

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
  return new Promise((resolve, reject) => {
    const worker = new Worker(source, { eval: true, workerData: data });
    worker.once('message', (value) => {
      resolve(value);
      worker.terminate(); // otherwise the thread keeps the process alive
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`worker exited with code ${code}`));
    });
  });
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
