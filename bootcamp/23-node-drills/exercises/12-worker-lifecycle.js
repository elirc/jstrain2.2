// ─────────────────────────────────────────────────────────────────────────
//  12 · a worker client with a lifecycle                    ★★★ stretch
//  concepts: worker_threads · correlation ids · graceful shutdown
//  run: node 12-worker-lifecycle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 17 got one round trip out of a long-lived worker. A service
//  needs the rest of the story: replies that overtake each other, a count
//  of what is outstanding, and a shutdown that neither drops work in
//  flight nor accepts new work.
//
//  Build `createClient()` on ONE worker (use the provided makeWorker),
//  returning three things:
//
//      send({ n, delayMs })  → Promise of n * 2
//      inFlight()            → how many requests are still waiting
//      close()               → Promise, resolved when it is really shut
//
//  · one worker serves every call, however many are outstanding
//  · the worker answers slow requests late, so a reply must reach the
//    caller it belongs to and no other
//  · close() lets the requests already in flight finish, then terminates
//    the thread; calling it twice is not an error
//  · after close(), send() rejects with `client is closed`
//  · if the worker dies on its own, every request in flight rejects
//    rather than hanging forever

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { Worker } from 'node:worker_threads';

// Provided: the worker program. It doubles what you send it, after the
// delay you ask for — and exits on the spot if you send it `crash`.
export const DOUBLER = `
  const { parentPort } = require('node:worker_threads');
  parentPort.on('message', ({ id, n, delayMs, crash }) => {
    if (crash) process.exit(1);
    setTimeout(() => parentPort.postMessage({ id, result: n * 2 }), delayMs || 0);
  });
`;

// Provided: every thread started here is recorded, so the tests can check
// that you start one and that you shut it down.
export const created = [];
export const exited = [];

export function makeWorker() {
  const worker = new Worker(DOUBLER, { eval: true });
  const threadId = worker.threadId; // it becomes -1 once the thread is gone
  created.push(threadId);
  worker.once('exit', () => exited.push(threadId));
  return worker;
}

export function resetLog() {
  created.length = 0;
  exited.length = 0;
}

export function createClient() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a request round trips', async () => {
  resetLog();
  const client = createClient();
  try {
    eq(await client.send({ n: 21 }), 42);
    eq(created.length, 1);
  } finally {
    await client.close();
  }
});

test('a late reply still reaches the caller it belongs to', async () => {
  resetLog();
  const client = createClient();
  try {
    const slow = client.send({ n: 1, delayMs: 25 });
    const fast = client.send({ n: 2 });
    eq(await fast, 4, 'the second request answers first');
    eq(await slow, 2, 'and the first one still gets its own answer');
    eq(created.length, 1, 'one worker served both');
  } finally {
    await client.close();
  }
});

test('inFlight counts what is outstanding, then goes quiet', async () => {
  resetLog();
  const client = createClient();
  try {
    eq(client.inFlight(), 0);
    const work = [client.send({ n: 1 }), client.send({ n: 2, delayMs: 15 })];
    eq(client.inFlight(), 2);
    eq(await Promise.all(work), [2, 4]);
    eq(client.inFlight(), 0);
  } finally {
    await client.close();
  }
});

test('close waits for the work already in flight', async () => {
  resetLog();
  const client = createClient();
  const slow = client.send({ n: 21, delayMs: 25 });
  const closing = client.close();
  eq(await slow, 42, 'closing must not drop a request already sent');
  await closing;
  eq(client.inFlight(), 0);
});

test('after close the door is shut and the thread is gone', async () => {
  resetLog();
  const client = createClient();
  const threadId = created[0];
  eq(await client.send({ n: 1 }), 2);
  await client.close();
  await client.close(); // twice is not an error
  await sleep(30);
  ok(exited.includes(threadId), 'the worker you started should have exited');
  await rejects(() => client.send({ n: 1 }), 'client is closed');
});

test('a worker that dies rejects everything in flight', async () => {
  resetLog();
  const client = createClient();
  const orphan = client.send({ n: 5, delayMs: 5000 });
  const doomed = client.send({ crash: true });
  await rejects(() => orphan, 'exited');
  await rejects(() => doomed, 'exited');
  eq(client.inFlight(), 0, 'nothing is left waiting for a dead thread');
  await client.close();
});
