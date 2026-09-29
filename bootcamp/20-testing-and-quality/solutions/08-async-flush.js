// ─────────────────────────────────────────────────────────────────────────
//  08 · flushing promises — SOLUTION                            ★★☆ core
//  run: node 08-async-flush.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `await sleep(10)` in a test is a guess about how long the
//  microtask queue needs. `flushPromises` is not a guess: one setImmediate
//  is a MACROtask, and Node drains the entire microtask queue — including
//  every `.then` those microtasks chain — before any macrotask runs. So by
//  the time the callback fires, all promise work that could proceed, has.
//  The queue is the classic unit whose interesting states are the middle
//  ones: two running, one waiting. Deferreds are how you freeze it there —
//  a task that only settles when the TEST says so — and flushPromises is
//  how you step the machine forward one settled promise at a time.
//  `pump` is called from two places: on add, and in the `finally` of every
//  task. The finally is not optional — put the bookkeeping in `.then` and
//  a rejected task never decrements `running`, so the queue wedges after
//  the first error and every later test in the file times out.
//  `.then(resolve, reject)` also means the failure is delivered to the
//  caller's promise and considered handled, which is why one bad task
//  cannot take down the process with an unhandled rejection.

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
  return new Promise((resolve) => setImmediate(resolve));
}

export function createQueue(concurrency) {
  const waiting = [];
  let running = 0;
  let done = 0;

  const pump = () => {
    while (running < concurrency && waiting.length > 0) {
      const job = waiting.shift();
      running += 1;
      Promise.resolve()
        .then(job.task)
        .then(job.resolve, job.reject)
        .finally(() => {
          running -= 1;
          done += 1;
          pump();
        });
    }
  };

  return {
    add(task) {
      return new Promise((resolve, reject) => {
        waiting.push({ task, resolve, reject });
        pump();
      });
    },
    stats: () => ({ running, queued: waiting.length, done }),
  };
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
