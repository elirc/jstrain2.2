// ─────────────────────────────────────────────────────────────────────────
//  41 · retry with full jitter — SOLUTION                    ★★☆ core
//  run: node 41-retry-full-jitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `fullJitter` is one line of arithmetic — cap the doubling,
//  then scale it by a random draw. Keeping it PURE (no timers, no global
//  Math.random) is what makes the ceiling testable at all; every awkward
//  "how do I test backoff" question dissolves once `random` and `wait` are
//  parameters with sensible defaults.
//  `retryJittered` is the usual for-loop with try/catch, plus one guard:
//  no wait after the FINAL attempt. That trailing sleep is the classic
//  off-by-one — it makes every failing call take one whole backoff longer
//  than it needs to, which is felt most exactly when things are worst.
//  Why FULL jitter and not "exponential plus a little noise"? Because the
//  point is to spread clients over the whole window. AWS's own writeup
//  found full jitter beats decorrelated tweaks on both client wait and
//  server load; a narrow ±10% band still leaves a stampede.
//  Wrong turn: throwing the FIRST error. Callers want the most recent
//  failure — it describes why you finally gave up.

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';

// A deterministic pseudo-random generator, so tests never flake.
export const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

// Rejects `failures` times, then resolves with 'ok'. No timers.
export function makeFlaky(failures) {
  const fn = spy(() => {
    fn.tries += 1;
    return fn.tries > failures
      ? Promise.resolve('ok')
      : Promise.reject(new Error(`try ${fn.tries} failed`));
  });
  fn.tries = 0;
  return fn;
}

export function fullJitter(attempt, options = {}) {
  const { baseMs = 20, capMs = 200, random = Math.random } = options;
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return random() * ceiling;
}

export async function retryJittered(fn, options = {}) {
  const {
    attempts = 3,
    baseMs = 20,
    capMs = 200,
    random = Math.random,
    wait = sleep,
  } = options;

  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1) {
        await wait(fullJitter(attempt, { baseMs, capMs, random }));
      }
    }
  }
  throw lastError;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('scales the ceiling by the random draw', () => {
  eq(fullJitter(0, { baseMs: 20, random: () => 0.5 }), 10);
  eq(fullJitter(0, { baseMs: 20, random: () => 0 }), 0);
});

test('doubles the ceiling with every attempt', () => {
  const opts = { baseMs: 20, capMs: 1000, random: () => 1 };
  eq([0, 1, 2, 3].map((a) => fullJitter(a, opts)), [20, 40, 80, 160]);
});

test('clamps the ceiling at capMs', () => {
  const opts = { baseMs: 20, capMs: 50, random: () => 1 };
  eq([0, 1, 2, 5].map((a) => fullJitter(a, opts)), [20, 40, 50, 50]);
});

test('every seeded draw stays inside its own ceiling', () => {
  const random = seeded(42);
  const opts = { baseMs: 20, capMs: 200, random };
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ceiling = Math.min(200, 20 * 2 ** attempt);
    const ms = fullJitter(attempt, opts);
    ok(ms >= 0 && ms < ceiling, `${ms} outside [0, ${ceiling})`);
  }
});

test('returns the value on the first try, waiting for nothing', async () => {
  const wait = spy(async () => {});
  const fn = makeFlaky(0);
  eq(await retryJittered(fn, { attempts: 3, wait }), 'ok');
  eq(fn.callCount, 1);
  eq(wait.callCount, 0);
});

test('waits between attempts, never after the last one', async () => {
  const wait = spy(async () => {});
  const fn = makeFlaky(99);
  await rejects(
    retryJittered(fn, { attempts: 3, baseMs: 20, random: () => 1, wait }),
    'try 3 failed'
  );
  eq(fn.callCount, 3);
  eq(
    wait.calls.map(([ms]) => ms),
    [20, 40]
  );
});

test('stops retrying as soon as it works', async () => {
  const wait = spy(async () => {});
  const fn = makeFlaky(1);
  eq(await retryJittered(fn, { attempts: 4, random: () => 0.5, wait }), 'ok');
  eq(fn.callCount, 2);
  eq(wait.callCount, 1);
});

test('really sleeps when you do not inject a wait', async () => {
  const t0 = Date.now();
  const fn = makeFlaky(1);
  eq(
    await retryJittered(fn, { attempts: 2, baseMs: 20, random: () => 1 }),
    'ok'
  );
  ok(Date.now() - t0 >= 10, 'the default wait must be a real delay');
});
