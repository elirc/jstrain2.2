// ─────────────────────────────────────────────────────────────────────────
//  11 · a token bucket on an injected clock                     ★★☆ core
//  concepts: rate limiting · lazy refill · injected time
//  run: node 11-token-bucket-clock.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 18 rate-limited a server. Rebuild the limiter itself, cold, on
//  a clock you own — and note what it does NOT contain: a timer.
//
//  Build `createLimiter({ capacity, refillPerSecond, clock })` →
//  an object with one method, `take(key)`:
//
//      { ok: true,  remaining, retryAfterMs: 0 }   a token was spent
//      { ok: false, remaining: 0, retryAfterMs }   the bucket is empty
//
//  · every key starts with a full bucket of `capacity` tokens
//  · a call spends one token; `remaining` is whole tokens left, floored
//  · tokens come back at `refillPerSecond`, and never exceed `capacity`
//  · `retryAfterMs` is how long until one whole token exists, rounded up
//  · read time only through `clock.now()`
//
//      capacity 1, refillPerSecond 2 → after a refusal, retryAfterMs 500

import { test, eq, ok } from '../../_lib/check.js';

// Provided: the clock. now() reads it, advance(ms) moves it, and nothing
// else in the process can tell the difference.
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

export function createLimiter(options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a burst up to the bucket size is allowed, then refused', () => {
  const limiter = createLimiter({
    capacity: 3,
    refillPerSecond: 1,
    clock: makeClock(),
  });
  eq(limiter.take('ada').ok, true);
  eq(limiter.take('ada').ok, true);
  eq(limiter.take('ada').ok, true);
  eq(limiter.take('ada').ok, false);
});

test('remaining counts down and bottoms out at zero', () => {
  const limiter = createLimiter({
    capacity: 2,
    refillPerSecond: 1,
    clock: makeClock(),
  });
  eq(limiter.take('ada'), { ok: true, remaining: 1, retryAfterMs: 0 });
  eq(limiter.take('ada'), { ok: true, remaining: 0, retryAfterMs: 0 });
  eq(limiter.take('ada').remaining, 0);
});

test('a refusal says exactly when the next token lands', () => {
  const limiter = createLimiter({
    capacity: 1,
    refillPerSecond: 2,
    clock: makeClock(),
  });
  limiter.take('ada');
  eq(limiter.take('ada'), { ok: false, remaining: 0, retryAfterMs: 500 });
});

test('tokens drip back as the clock moves', () => {
  const clock = makeClock();
  const limiter = createLimiter({ capacity: 2, refillPerSecond: 2, clock });
  limiter.take('ada');
  limiter.take('ada');
  eq(limiter.take('ada').ok, false);

  clock.advance(500); // one token at two per second
  eq(limiter.take('ada').ok, true);
  eq(limiter.take('ada').ok, false);
});

test('a fractional refill accumulates instead of rounding away', () => {
  const clock = makeClock();
  const limiter = createLimiter({ capacity: 2, refillPerSecond: 2, clock });
  limiter.take('ada');
  limiter.take('ada');

  clock.advance(250);
  eq(limiter.take('ada'), { ok: false, remaining: 0, retryAfterMs: 250 });
  clock.advance(250);
  eq(limiter.take('ada').ok, true, 'half a token plus half a token');
});

test('a quiet week does not overfill the bucket', () => {
  const clock = makeClock();
  const limiter = createLimiter({ capacity: 2, refillPerSecond: 1, clock });
  limiter.take('ada');
  clock.advance(7 * 24 * 60 * 60 * 1000);
  eq(limiter.take('ada').ok, true);
  eq(limiter.take('ada').ok, true);
  eq(limiter.take('ada').ok, false, 'capacity is the ceiling, always');
});

test('one noisy key does not spend another key\'s tokens', () => {
  const limiter = createLimiter({
    capacity: 1,
    refillPerSecond: 1,
    clock: makeClock(),
  });
  eq(limiter.take('ada').ok, true);
  eq(limiter.take('ada').ok, false);
  eq(limiter.take('bo').ok, true);
});

test('an hour of policy costs no real time and no timers', () => {
  const clock = makeClock();
  const limiter = createLimiter({ capacity: 5, refillPerSecond: 1, clock });
  const started = Date.now();
  let allowed = 0;
  for (let minute = 0; minute < 60; minute += 1) {
    clock.advance(60_000);
    for (let i = 0; i < 10; i += 1) if (limiter.take('ada').ok) allowed += 1;
  }
  eq(allowed, 5 * 60, 'a full bucket every minute, never more');
  ok(Date.now() - started < 100, 'an hour, instantly');
});
