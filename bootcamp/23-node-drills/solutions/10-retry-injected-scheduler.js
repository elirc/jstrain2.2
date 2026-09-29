// ─────────────────────────────────────────────────────────────────────────
//  10 · retry with an injected scheduler — SOLUTION          ★★★ stretch
//  run: node 10-retry-injected-scheduler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the retry logic here is ordinary. What makes the tests
//  possible is one parameter — the unit asks `scheduler` for its waits
//  instead of reaching for the global setTimeout. In production you pass
//  `{ setTimeout, clearTimeout }` and nothing changes; in a test you pass
//  a fake and eight minutes of backoff cost zero milliseconds. The unit
//  never learns which one it got.
//  `wait` is the whole bridge: a promise whose resolve IS the timer
//  callback. Await it and the function parks until someone runs that
//  timer — the event loop in production, `scheduler.next()` in a test.
//  The loop counts ATTEMPTS, not retries, and the wait belongs before the
//  retry rather than after the failure. Written the other way round you
//  sleep once more after the final failure — a delay nobody is waiting
//  for, and on a hot path, a leaked timer holding the process open.
//  The exponent is `attempt - 1` so the first retry waits `baseMs`. Off
//  by one here and every client in your fleet backs off twice as hard as
//  the runbook says, which nobody notices until an outage.
//  Wrong turn one: `await sleep(ms)` "just for now", planning to inject
//  later. The test then takes seven real seconds, so it gets marked slow,
//  then flaky, then skipped.
//  Wrong turn two: swallowing the last error and resolving undefined. A
//  retry that gives up must say so — the caller's fallback depends on it.
//  Real backoff adds jitter (a random fraction of the delay) so a
//  thousand clients that failed together do not retry together. Jitter is
//  a second injected dependency, tested exactly the same way.

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

export async function retry(operation, options = {}) {
  const { attempts = 3, baseMs = 100, factor = 2, scheduler } = options;
  const wait = (ms) => new Promise((resolve) => scheduler.setTimeout(resolve, ms));

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) await wait(baseMs * factor ** (attempt - 2));
    try {
      return await operation();
    } catch (err) {
      lastError = err; // keep it; the caller needs the real reason
    }
  }
  throw lastError;
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
