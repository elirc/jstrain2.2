// ─────────────────────────────────────────────────────────────────────────
//  09 · a long-lived worker                                 ★★★ stretch
//  concepts: postMessage · request/response correlation · terminate
//  run: node 09-worker-roundtrip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 08 threw a thread away after one answer. That cost — tens of
//  milliseconds of V8 bootstrap — is exactly what a pool exists to avoid.
//  Start ONE worker, keep talking to it, shut it down on purpose.
//
//      const calc = createDoubler();
//      await calc.double(21)                  → 42
//      await Promise.all([calc.double(1), calc.double(2)])   → [2, 4]
//      await calc.close()                     // the thread exits
//
//  The catch: postMessage is a one-way pipe. Three requests in flight
//  means three replies arriving in whatever order the worker finishes
//  them, on ONE 'message' listener. You need to know which reply belongs
//  to which promise.
//
//  The worker echoes back the `id` you sent: { id, n } → { id, result }.
//  Use makeWorker() so the tests can see how many threads you started.
//
//  hint: a Map from id → resolve is the whole trick; stamp each request
//  with a counter, look the resolver up when the reply lands

import { test, eq, ok, sleep } from '../../_lib/check.js';
import { Worker } from 'node:worker_threads';

// Provided: the worker program. It answers every message it is sent.
export const DOUBLER = `
  const { parentPort } = require('node:worker_threads');
  parentPort.on('message', ({ id, n }) => {
    parentPort.postMessage({ id, result: n * 2 });
  });
`;

// Provided: every thread started here is recorded, so the tests can
// check that you start one and keep it.
export const created = [];
export const exited = [];

export function makeWorker() {
  const worker = new Worker(DOUBLER, { eval: true });
  const id = worker.threadId;
  created.push(id);
  worker.once('exit', () => exited.push(id));
  return worker;
}

export function resetLog() {
  created.length = 0;
  exited.length = 0;
}

export function createDoubler() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('doubles a number', async () => {
  resetLog();
  const calc = createDoubler();
  try {
    eq(await calc.double(21), 42);
  } finally {
    await calc.close();
  }
});

test('concurrent calls each get their own answer', async () => {
  resetLog();
  const calc = createDoubler();
  try {
    eq(await Promise.all([calc.double(1), calc.double(2), calc.double(3)]), [
      2, 4, 6,
    ]);
    eq(created.length, 1, 'one worker should serve every call');
  } finally {
    await calc.close();
  }
});

test('sequential calls keep working on the same thread', async () => {
  resetLog();
  const calc = createDoubler();
  try {
    eq(await calc.double(5), 10);
    eq(await calc.double(50), 100);
    eq(created.length, 1);
  } finally {
    await calc.close();
  }
});

test('zero and negative numbers are fine', async () => {
  resetLog();
  const calc = createDoubler();
  try {
    eq(await Promise.all([calc.double(0), calc.double(-4)]), [0, -8]);
  } finally {
    await calc.close();
  }
});

test('close() actually shuts the thread down', async () => {
  resetLog();
  const calc = createDoubler();
  eq(await calc.double(1), 2);
  await calc.close();
  await sleep(30);
  eq(exited.length, 1, 'the worker should have exited');
  ok(exited[0] === created[0], 'and it should be the one you started');
});
