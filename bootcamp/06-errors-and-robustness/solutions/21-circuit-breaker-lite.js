// ─────────────────────────────────────────────────────────────────────────
//  21 · circuit breaker lite — SOLUTION                     ★★★ stretch
//  run: node 21-circuit-breaker-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three states, two variables. `failures` counts the
//  consecutive failures and `openedAt` remembers when the breaker
//  tripped — everything else is derived. state() is a pure function of
//  those two plus the clock, which is why 'half-open' needs no timer:
//  it is simply "open, and the cooldown has elapsed by now".
//  Deriving state instead of storing it kills a whole class of bug —
//  the setTimeout that fires after the object is gone, the state that
//  drifts because one path forgot to reset it.
//  The catch block asks `state()` BEFORE touching anything: if we were
//  half-open, this was the trial, so the cooldown restarts rather than
//  the failure count climbing forever. On success both variables are
//  cleared, which is the only way back to closed.
//  Note the error still reaches the caller. A breaker changes WHEN you
//  call, never what the caller is told about a real failure.
//  Classic wrong turn: a breaker that swallows the error and returns
//  undefined — now the caller cannot tell "no rows" from "no database".

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createBreaker(options = {}) {
  const {
    failureThreshold = 3,
    cooldownMs = 1000,
    clock = { now: () => Date.now() },
  } = options;

  let failures = 0;
  let openedAt = null;

  const state = () => {
    if (openedAt === null) return 'closed';
    return clock.now() - openedAt >= cooldownMs ? 'half-open' : 'open';
  };

  return {
    state,
    async call(fn) {
      if (state() === 'open') {
        throw Object.assign(new Error('circuit is open'), {
          code: 'CIRCUIT_OPEN',
        });
      }
      try {
        const value = await fn();
        failures = 0;
        openedAt = null;
        return value;
      } catch (err) {
        if (state() === 'half-open') {
          openedAt = clock.now(); // the trial failed: cool down again
        } else {
          failures += 1;
          if (failures >= failureThreshold) openedAt = clock.now();
        }
        throw err;
      }
    },
  };
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
