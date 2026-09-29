// ─────────────────────────────────────────────────────────────────────────
//  21 · circuit breaker lite                                ★★★ stretch
//  concepts: state machines · injected clocks · failing fast
//  run: node 21-circuit-breaker-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Retrying a dead dependency is how one outage becomes two: every
//  caller queues up behind a service that cannot answer, and the retries
//  are the load that keeps it down. A breaker gives up ON PURPOSE for a
//  while, then sends exactly one call to find out if things are better.
//
//    createBreaker({ failureThreshold = 3, cooldownMs = 1000, clock })
//        → { call(fn), state() }
//
//    closed     calls go through. A success resets the failure count.
//               `failureThreshold` failures IN A ROW → open (and that
//               last error still reaches the caller)
//    open       call() refuses without touching fn, throwing an Error
//               with code 'CIRCUIT_OPEN'
//    half-open  once cooldownMs has passed on the clock. The next call
//               is a trial: success → closed and counters cleared,
//               failure → open again with the cooldown restarted
//
//  Read time only through `clock.now()`. No timers — the state is
//  derived from the clock the moment somebody asks. You will meet the
//  same injected-clock trick again in module 23's token bucket
//  (`23-node-drills/exercises/11-token-bucket-clock.js`).
//
//  hint: one variable — when the breaker opened, or null — plus a
//  failure counter is enough to derive all three states.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createBreaker(options = {}) {
  throw new Error('TODO');
}

// ── given: test fixtures & helpers ───────────────────────────────────────

// the clock. now() reads it, advance(ms) moves it, and nothing in the
// process can tell the difference.
export function makeClock(startMs = 0) {
  let current = startMs;
  return {
    now: () => current,
    advance(ms) {
      current += ms;
      return current;
    },
  };
}

const failing = () => {
  throw new Error('db down');
};

// returns the error an async fn rejected with, so a test can inspect it
async function rejectedBy(fn) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to reject, but it resolved');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('starts closed and passes the value through', async () => {
  const breaker = createBreaker({ clock: makeClock() });
  eq(breaker.state(), 'closed');
  eq(await breaker.call(async () => 'rows'), 'rows');
});

test('a failure still reaches the caller', async () => {
  const breaker = createBreaker({ failureThreshold: 3, clock: makeClock() });
  const err = await rejectedBy(() => breaker.call(failing));
  eq(err.message, 'db down');
  eq(breaker.state(), 'closed');
});

test('trips open after failureThreshold failures in a row', async () => {
  const breaker = createBreaker({ failureThreshold: 3, clock: makeClock() });
  await rejectedBy(() => breaker.call(failing));
  await rejectedBy(() => breaker.call(failing));
  eq(breaker.state(), 'closed');
  await rejectedBy(() => breaker.call(failing));
  eq(breaker.state(), 'open');
});

test('an open breaker refuses without calling fn', async () => {
  const breaker = createBreaker({ failureThreshold: 1, clock: makeClock() });
  await rejectedBy(() => breaker.call(failing));
  const fn = spy(async () => 'rows');
  const err = await rejectedBy(() => breaker.call(fn));
  eq(err.code, 'CIRCUIT_OPEN');
  eq(fn.callCount, 0);
});

test('a success resets the failure count', async () => {
  const breaker = createBreaker({ failureThreshold: 3, clock: makeClock() });
  await rejectedBy(() => breaker.call(failing));
  await rejectedBy(() => breaker.call(failing));
  await breaker.call(async () => 'rows');
  await rejectedBy(() => breaker.call(failing));
  await rejectedBy(() => breaker.call(failing));
  eq(breaker.state(), 'closed');
});

test('the cooldown turns an open breaker half-open', async () => {
  const clock = makeClock();
  const breaker = createBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    clock,
  });
  await rejectedBy(() => breaker.call(failing));
  clock.advance(999);
  eq(breaker.state(), 'open');
  clock.advance(1);
  eq(breaker.state(), 'half-open');
});

test('a successful trial closes the breaker again', async () => {
  const clock = makeClock();
  const breaker = createBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    clock,
  });
  await rejectedBy(() => breaker.call(failing));
  clock.advance(1000);
  eq(await breaker.call(async () => 'rows'), 'rows');
  eq(breaker.state(), 'closed');
});

test('a failed trial re-opens it and restarts the cooldown', async () => {
  const clock = makeClock();
  const breaker = createBreaker({
    failureThreshold: 1,
    cooldownMs: 1000,
    clock,
  });
  await rejectedBy(() => breaker.call(failing));
  clock.advance(1000);
  const err = await rejectedBy(() => breaker.call(failing));
  eq(err.message, 'db down');
  eq(breaker.state(), 'open');
  clock.advance(999);
  eq(breaker.state(), 'open');
  clock.advance(1);
  ok(breaker.state() === 'half-open');
});
