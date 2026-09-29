// ─────────────────────────────────────────────────────────────────────────
//  24 · createQueue (one job at a time)                    ★★★ stretch
//  concepts: serialisation · deferred promises · FIFO
//  run: node 24-task-queue.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Some resources tolerate exactly one writer: a SQLite file, a serial
//  port, a rate-limited API. Build a queue that runs pushed jobs one at
//  a time, in the order they were pushed.
//
//      const q = createQueue();
//      const a = q.push(() => slow('a', 30));   // starts now
//      const b = q.push(() => slow('b', 5));    // waits for a
//      await a  → 'a'   await b  → 'b'          // b never overtakes a
//
//  push(job) returns a promise for that job's result. A job that throws
//  rejects ONLY its own promise — the queue keeps draining. Jobs are
//  functions, not promises: a promise has already started.
//
//  hint: keep an array of { job, resolve, reject } and a `running` flag

import { test, eq, rejects, sleep } from '../../_lib/check.js';

export const tracker = { inFlight: 0, maxInFlight: 0, order: [] };

export const resetTracker = () => {
  tracker.inFlight = 0;
  tracker.maxInFlight = 0;
  tracker.order = [];
};

// A job factory: returns a function that resolves with `label`.
export const slow = (label, ms) => async () => {
  tracker.inFlight += 1;
  tracker.maxInFlight = Math.max(tracker.maxInFlight, tracker.inFlight);
  await sleep(ms);
  tracker.inFlight -= 1;
  tracker.order.push(label);
  return label;
};

export function createQueue() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves each push with its own job result', async () => {
  resetTracker();
  const q = createQueue();
  eq(await q.push(slow('a', 5)), 'a');
});

test('never runs two jobs at once', async () => {
  resetTracker();
  const q = createQueue();
  await Promise.all([q.push(slow('a', 10)), q.push(slow('b', 5))]);
  eq(tracker.maxInFlight, 1);
});

test('keeps FIFO order even when the first job is slowest', async () => {
  resetTracker();
  const q = createQueue();
  await Promise.all([
    q.push(slow('a', 30)),
    q.push(slow('b', 5)),
    q.push(slow('c', 5)),
  ]);
  eq(tracker.order, ['a', 'b', 'c']);
});

test('a failing job rejects only its own promise', async () => {
  resetTracker();
  const q = createQueue();
  const bad = q.push(() => Promise.reject(new Error('bad job')));
  const good = q.push(slow('after', 5));
  await Promise.all([rejects(bad, 'bad job'), good]);
  eq(await good, 'after');
});

test('the queue keeps draining after a failure', async () => {
  resetTracker();
  const q = createQueue();
  const bad = q.push(() => {
    throw new Error('sync boom');
  });
  const rest = [q.push(slow('x', 5)), q.push(slow('y', 5))];
  await Promise.all([rejects(bad, 'sync boom'), ...rest]);
  eq(tracker.order, ['x', 'y']);
});

test('accepts new jobs after the queue went idle', async () => {
  resetTracker();
  const q = createQueue();
  eq(await q.push(slow('first', 5)), 'first');
  eq(await q.push(slow('second', 5)), 'second');
  eq(tracker.order, ['first', 'second']);
});
