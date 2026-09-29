// ─────────────────────────────────────────────────────────────────────────
//  10 · retry with an injected scheduler                    ★★★ stretch
//  concepts: exponential backoff · dependency injection · fake timers
//  run: node 10-retry-injected-scheduler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A retry that calls the global setTimeout is a unit you can only test
//  by waiting for it. Module 20 built the fake scheduler; this is the
//  other half — writing the unit so the fake can drive it.
//
//  Build `retry(operation, options)`:
//
//      options → { attempts = 3, baseMs = 100, factor = 2, scheduler }
//
//  · call `operation()`, resolve with its value the moment it succeeds
//  · after a failure, wait — through `scheduler`, never the global timer
//    — and try again, up to `attempts` calls in total
//  · the wait before retry number k is `baseMs * factor ** (k - 1)`:
//
//        attempts: 4, baseMs: 100, factor: 2  →  waits 100, 200, 400
//
//  · when the last attempt fails, reject with THAT error
//  · leave no timer pending behind you

import { test, eq, ok, rejects } from '../../_lib/check.js';

// Provided: the fake scheduler. `delays` records every wait that was
// asked for, in order — that is what the tests read.
export function createFakeScheduler() {
  let now = 0;
  let nextId = 1;
  let timers = [];
  const delays = [];

  return {
    delays,
    now: () => now,
    pending: () => timers.length,
    setTimeout(fn, ms = 0) {
      delays.push(ms);
      const id = nextId++;
      timers.push({ id, due: now + ms, fn });
      return id;
    },
    clearTimeout(id) {
      timers = timers.filter((timer) => timer.id !== id);
    },
    next() {
      if (timers.length === 0) return now;
      timers.sort((a, b) => a.due - b.due || a.id - b.id);
      const [timer] = timers.splice(0, 1);
      now = timer.due;
      timer.fn();
      return now;
    },
    runAll() {
      while (timers.length > 0) this.next();
      return now;
    },
  };
}

// Provided: settle a pending promise, answering every wait the scheduler
// is holding, without a millisecond of real time passing.
export async function drive(promise, scheduler, maxSteps = 100) {
  let settled = false;
  const tracked = promise.then(
    (value) => {
      settled = true;
      return value;
    },
    (err) => {
      settled = true;
      throw err;
    }
  );
  tracked.catch(() => {}); // the caller awaits `tracked` and sees it there
  for (let step = 0; step < maxSteps && !settled; step += 1) {
    await new Promise((resolve) => setImmediate(resolve));
    if (settled || scheduler.pending() === 0) break;
    scheduler.next();
  }
  return tracked;
}

// Provided: an operation that fails `failures` times, then succeeds.
export function flaky(failures, value = 'ok') {
  let calls = 0;
  const operation = async () => {
    calls += 1;
    if (calls <= failures) throw new Error(`attempt ${calls} failed`);
    return value;
  };
  operation.calls = () => calls;
  return operation;
}

export function retry(operation, options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an operation that works is called once and never waits', async () => {
  const scheduler = createFakeScheduler();
  const operation = flaky(0, 'first time');
  eq(await drive(retry(operation, { scheduler }), scheduler), 'first time');
  eq(operation.calls(), 1);
  eq(scheduler.delays, []);
});

test('it retries until it succeeds, and returns the value', async () => {
  const scheduler = createFakeScheduler();
  const operation = flaky(2, 'finally');
  eq(await drive(retry(operation, { scheduler }), scheduler), 'finally');
  eq(operation.calls(), 3);
});

test('the backoff schedule is exactly 100, 200, 400', async () => {
  const scheduler = createFakeScheduler();
  const operation = flaky(3, 'ok');
  await drive(retry(operation, { attempts: 4, scheduler }), scheduler);
  eq(scheduler.delays, [100, 200, 400]);
});

test('base and factor are yours to pick', async () => {
  const scheduler = createFakeScheduler();
  await drive(
    retry(flaky(3), { attempts: 4, baseMs: 50, factor: 3, scheduler }),
    scheduler
  );
  eq(scheduler.delays, [50, 150, 450]);
});

test('it gives up after `attempts` tries, with the last error', async () => {
  const scheduler = createFakeScheduler();
  const operation = flaky(99);
  await rejects(
    () => drive(retry(operation, { attempts: 3, scheduler }), scheduler),
    'attempt 3 failed'
  );
  eq(operation.calls(), 3, 'exactly `attempts` calls, not one more');
  eq(scheduler.delays, [100, 200], 'and no wait after the final failure');
});

test('one attempt means no retries at all', async () => {
  const scheduler = createFakeScheduler();
  const operation = flaky(99);
  await rejects(
    () => drive(retry(operation, { attempts: 1, scheduler }), scheduler),
    'attempt 1 failed'
  );
  eq(operation.calls(), 1);
  eq(scheduler.delays, []);
});

test('nothing is left ticking once it has settled', async () => {
  const scheduler = createFakeScheduler();
  await drive(retry(flaky(2), { scheduler }), scheduler);
  eq(scheduler.pending(), 0);
  eq(scheduler.now(), 300, 'virtual time moved 100 + 200');
});

test('the whole thing costs zero real milliseconds', async () => {
  const scheduler = createFakeScheduler();
  const started = Date.now();
  await drive(
    retry(flaky(4), { attempts: 5, baseMs: 60_000, scheduler }),
    scheduler
  );
  ok(Date.now() - started < 100, 'four minutes of backoff, instantly');
  eq(scheduler.delays, [60_000, 120_000, 240_000, 480_000]);
});
