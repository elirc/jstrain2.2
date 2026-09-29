// ─────────────────────────────────────────────────────────────────────────
//  24 · createQueue (one job at a time) — SOLUTION         ★★★ stretch
//  run: node 24-task-queue.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: push wraps the job in a "deferred" — a promise whose
//  resolve and reject you stash next to the job — then asks the queue to
//  run. runNext returns immediately if a job is already running;
//  otherwise it shifts the next entry, awaits it, settles that entry's
//  deferred, and calls itself again in a finally so the queue keeps
//  draining after a failure.
//  The reason jobs must be FUNCTIONS is the whole point of the exercise:
//  `q.push(fetch(url))` would already have started the request. The
//  queue can only control when work BEGINS if it holds the trigger.
//  Wrong turn: letting a rejected job escape runNext. It becomes an
//  unhandled rejection and the queue stalls with running stuck at true —
//  that is what the finally is guarding.

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
  const entries = [];
  let running = false;

  const runNext = async () => {
    if (running) return;
    const entry = entries.shift();
    if (!entry) return;
    running = true;
    try {
      entry.resolve(await entry.job());
    } catch (err) {
      entry.reject(err);
    } finally {
      running = false;
      runNext();
    }
  };

  return {
    push(job) {
      return new Promise((resolve, reject) => {
        entries.push({ job, resolve, reject });
        runNext();
      });
    },
  };
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
