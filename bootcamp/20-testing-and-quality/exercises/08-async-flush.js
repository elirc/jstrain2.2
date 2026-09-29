// ─────────────────────────────────────────────────────────────────────────
//  08 · flushing promises                                       ★★☆ core
//  concepts: microtasks · deferreds · intermediate state
//  run: node 08-async-flush.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `await sleep(10)` in an async test is a guess, and guesses flake. What
//  you actually want is "let every promise that can settle, settle" — no
//  wall clock involved.
//
//      const order = [];
//      Promise.resolve().then(() => order.push('micro'));
//      order.push('sync');
//      await flushPromises();
//      order                          → ['sync', 'micro']
//
//  Then the unit that needs it: a concurrency-limited queue whose whole
//  behaviour lives in its MIDDLE states.
//
//      const q = createQueue(2);      // at most 2 tasks in flight
//      q.add(task)                    → a promise for that task's result
//      q.stats()                      → { running, queued, done }
//
//  Tasks start in add order, at most `concurrency` at a time, and every
//  time one settles the next waiting task starts. A task that throws must
//  reject only its OWN promise — the queue keeps going.
//
//  The provided `deferred()` is how the tests freeze the queue mid-flight:
//  a task returns a promise the test resolves by hand.
//
//  hint: one setImmediate is a macrotask, and Node drains the whole
//  microtask queue before macrotasks run. For the queue, put the
//  bookkeeping in a `finally` — a rejected task must still free its slot.

import { test, eq, rejects } from '../../_lib/check.js';

// Provided: a promise whose settling the test controls.
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function flushPromises() {
  throw new Error('TODO');
}

export function createQueue(concurrency) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('flushPromises lets already-queued microtasks run first', async () => {
  const order = [];
  Promise.resolve()
    .then(() => order.push('micro'))
    .then(() => order.push('chained'));
  order.push('sync');
  await flushPromises();
  eq(order, ['sync', 'micro', 'chained']);
});

test('the queue starts only up to the concurrency limit', async () => {
  const q = createQueue(2);
  const gates = [deferred(), deferred(), deferred()];
  const started = [];
  gates.forEach((g, i) =>
    q.add(() => {
      started.push(i);
      return g.promise;
    })
  );
  await flushPromises();
  eq(started, [0, 1]);
  eq(q.stats(), { running: 2, queued: 1, done: 0 });
  gates.forEach((g) => g.resolve());
});

test('finishing one task starts exactly one waiting task', async () => {
  const q = createQueue(2);
  const gates = [deferred(), deferred(), deferred(), deferred()];
  const started = [];
  gates.forEach((g, i) =>
    q.add(() => {
      started.push(i);
      return g.promise;
    })
  );
  await flushPromises();
  gates[0].resolve();
  await flushPromises();
  eq(started, [0, 1, 2]);
  eq(q.stats(), { running: 2, queued: 1, done: 1 });
  gates.forEach((g) => g.resolve());
});

test('with concurrency 1 the queue is a strict pipeline', async () => {
  const q = createQueue(1);
  const gates = [deferred(), deferred(), deferred()];
  const started = [];
  gates.forEach((g, i) =>
    q.add(() => {
      started.push(i);
      return g.promise;
    })
  );
  await flushPromises();
  eq(started, [0]);
  gates[0].resolve();
  await flushPromises();
  eq(started, [0, 1]);
  gates[1].resolve();
  await flushPromises();
  eq(started, [0, 1, 2]);
  gates[2].resolve();
});

test('add() resolves with the task result', async () => {
  const q = createQueue(2);
  eq(await q.add(async () => 42), 42);
  eq(await q.add(() => 'sync values work too'), 'sync values work too');
});

test('a failing task rejects its own promise and nothing else', async () => {
  const q = createQueue(1);
  await rejects(
    q.add(async () => {
      throw new Error('boom');
    }),
    'boom'
  );
  eq(await q.add(async () => 'still working'), 'still working');
});

test('a failure does not wedge the pump', async () => {
  const q = createQueue(1);
  const results = await Promise.allSettled([
    q.add(async () => {
      throw new Error('one');
    }),
    q.add(async () => 'two'),
    q.add(async () => 'three'),
  ]);
  eq(results.map((r) => r.status), ['rejected', 'fulfilled', 'fulfilled']);
  eq(q.stats(), { running: 0, queued: 0, done: 3 });
});

test('the queue drains back to zero and keeps results in add order', async () => {
  const q = createQueue(2);
  const out = await Promise.all(
    [1, 2, 3, 4, 5].map((n) => q.add(async () => n * 2))
  );
  eq(out, [2, 4, 6, 8, 10]);
  eq(q.stats(), { running: 0, queued: 0, done: 5 });
});
