// ─────────────────────────────────────────────────────────────────────────
//  41 · retry with full jitter                              ★★☆ core
//  concepts: backoff · jitter · dependency injection
//  run: node 41-retry-full-jitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Plain exponential backoff makes 500 clients retry at exactly 20ms,
//  40ms, 80ms — a synchronised stampede that keeps the service down.
//  "Full jitter" picks a random point in [0, ceiling) instead:
//
//      fullJitter(0, { baseMs: 20 })  → somewhere in [0, 20)
//      fullJitter(2, { baseMs: 20 })  → somewhere in [0, 80)
//      ceiling = min(capMs, baseMs * 2 ** attempt)   (attempt starts at 0)
//
//  Then build `retryJittered(fn, options)`: try `fn`, and on failure wait
//  `fullJitter(attemptIndex, ...)` before the next try — never after the
//  last one — and throw the LAST error when all attempts are spent.
//  `random` and `wait` are injected so tests can pin them down; default
//  `random` to Math.random and `wait` to a real sleep.
//
//  hint: keep fullJitter pure. All the awkward parts of testing backoff
//  disappear once the randomness and the sleeping are parameters.

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
  throw new Error('TODO');
}

export function retryJittered(fn, options = {}) {
  throw new Error('TODO');
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
