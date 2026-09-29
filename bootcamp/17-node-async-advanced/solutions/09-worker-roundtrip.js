// ─────────────────────────────────────────────────────────────────────────
//  09 · a long-lived worker — SOLUTION                      ★★★ stretch
//  run: node 09-worker-roundtrip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one worker, one 'message' listener, and a Map that holds
//  the resolver for every request still in flight. Each call takes the
//  next id, parks its `resolve` under that id, and posts. When a reply
//  arrives you look the resolver up, delete the entry (or the Map is a
//  slow memory leak) and settle. That correlation id is the same idea as
//  a JSON-RPC id or an HTTP/2 stream id — the moment a channel is shared
//  and replies can overtake each other, you need one.
//  Why keep the thread? Startup is the expensive part: bootstrapping a
//  V8 isolate costs tens of milliseconds, while a round trip on a warm
//  worker costs microseconds. Start N at boot, keep them, terminate on
//  shutdown. And terminate you must — an idle Worker refs the event
//  loop, so a "finished" CLI that forgot close() just never exits.
//  Wrong turn: `worker.once('message', resolve)` per call. With two
//  requests outstanding the first reply resolves whichever listener V8
//  happens to run first, and the answers silently swap.

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
  const worker = makeWorker();
  const pending = new Map();
  let nextId = 0;

  worker.on('message', ({ id, result }) => {
    const resolve = pending.get(id);
    if (!resolve) return; // a reply for a request we already gave up on
    pending.delete(id);
    resolve(result);
  });

  return {
    double(n) {
      nextId += 1;
      const id = nextId;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        worker.postMessage({ id, n });
      });
    },
    async close() {
      await worker.terminate();
    },
  };
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
