// ─────────────────────────────────────────────────────────────────────────
//  11 · a token bucket on an injected clock — SOLUTION           ★★☆ core
//  run: node 11-token-bucket-clock.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a token bucket, which is what every rate limiter worth
//  using turns out to be. Each key owns `capacity` tokens, a call spends
//  one, and they drip back at a fixed rate. Two properties fall out for
//  free: a burst up to the bucket size is fine (users really do arrive in
//  bursts), and the long-run average is exactly the refill rate.
//  The line that matters is the one that is missing. Nothing ticks. There
//  is no timer per key topping buckets up — the refill is computed lazily
//  from `now - updatedAt` on the next call. A million idle keys cost a
//  million map entries and zero CPU; a timer per key would melt the
//  process and, worse, keep it alive.
//  Keep tokens FRACTIONAL and floor only when you report. Rounding the
//  stored value is the classic bug: at two per second, two 250 ms gaps
//  are one whole token, and an implementation that floors on every write
//  loses both halves and starves the caller forever.
//  Clamp with Math.min(capacity, …) or an account that went quiet for a
//  week comes back holding 604,800 tokens and can replay a month of API
//  calls in one breath.
//  `retryAfterMs` is `(1 - tokens) / rate`, rounded up, and it is a
//  courtesy with teeth: without it a blocked client guesses, retries
//  immediately, and makes the overload worse.
//  The injected clock is what lets the tests assert 250 ms boundaries and
//  a full week of silence in the same suite, instantly. With Date.now()
//  neither of those tests can exist at all.
//  A single Map is right for one process. Two servers behind a load
//  balancer means two buckets and double the allowance — which is why
//  production limiters keep the counter in Redis.

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
  const { capacity = 5, refillPerSecond = 1, clock } = options;
  const buckets = new Map();

  return {
    take(key) {
      const at = clock.now();
      const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: at };

      const elapsed = Math.max(0, at - bucket.updatedAt);
      bucket.tokens = Math.min(
        capacity,
        bucket.tokens + (elapsed / 1000) * refillPerSecond
      );
      bucket.updatedAt = at;
      buckets.set(key, bucket);

      if (bucket.tokens < 1) {
        const seconds = (1 - bucket.tokens) / refillPerSecond;
        return { ok: false, remaining: 0, retryAfterMs: Math.ceil(seconds * 1000) };
      }

      bucket.tokens -= 1;
      return {
        ok: true,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: 0,
      };
    },
  };
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
