// ─────────────────────────────────────────────────────────────────────────
//  12 · a worker client with a lifecycle — SOLUTION          ★★★ stretch
//  run: node 12-worker-lifecycle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one 'message' listener, one Map, and an id per request.
//  Each call takes the next id, parks its resolve/reject under that id,
//  and posts. A reply looks its entry up, deletes it — leave it and the
//  Map is a slow leak — and settles. That id is the same idea as a
//  JSON-RPC id or an HTTP/2 stream id: the moment one channel carries
//  overlapping conversations, correlation stops being optional. The test
//  where the second request answers first is exactly the case that
//  `worker.once('message', resolve)` per call gets silently wrong — the
//  first reply settles whichever listener runs first, and two callers
//  swap answers with no error anywhere.
//  The lifecycle is the new half, and it is three states, not two: open,
//  closing (drain, refuse new), closed. `closed = true` first so nothing
//  new can join the drain, then await the promises that were already in
//  flight, THEN terminate. Terminate first and you kill work a caller is
//  still awaiting, which surfaces as a promise that never settles — the
//  worst failure shape there is, because it has no stack and no log line.
//  `closing` memoises the drain so the second close() joins the first
//  instead of starting a second teardown. Shutdown paths get called twice
//  in real life: a signal handler and a finally block, racing.
//  The 'exit' handler is the other half of "never hang". A worker can die
//  on its own — an uncaught throw, an OOM kill, process.exit in code you
//  did not write — and every promise parked in that Map is waiting for a
//  thread that no longer exists. Reject them all, with the exit code, and
//  a crash becomes an error your caller can handle.
//  And terminate you must: an idle Worker refs the event loop, so a
//  "finished" CLI that forgot close() simply never exits.

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
  const worker = makeWorker();
  const pending = new Map(); // id → { resolve, reject, promise }
  let nextId = 0;
  let closed = false;
  let closing = null;

  worker.on('message', ({ id, result }) => {
    const entry = pending.get(id);
    if (!entry) return; // a reply for a request we already gave up on
    pending.delete(id);
    entry.resolve(result);
  });

  worker.on('exit', (code) => {
    for (const [id, entry] of pending) {
      pending.delete(id);
      entry.reject(new Error(`worker exited with code ${code}`));
    }
  });

  return {
    send(request) {
      if (closed) return Promise.reject(new Error('client is closed'));
      const id = (nextId += 1);
      const entry = {};
      entry.promise = new Promise((resolve, reject) => {
        entry.resolve = resolve;
        entry.reject = reject;
        pending.set(id, entry);
        worker.postMessage({ id, ...request });
      });
      return entry.promise;
    },

    inFlight: () => pending.size,

    close() {
      closed = true; // refuse new work before draining the old
      if (!closing) {
        const draining = [...pending.values()].map((entry) => entry.promise);
        closing = Promise.allSettled(draining).then(() => worker.terminate());
      }
      return closing;
    },
  };
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
