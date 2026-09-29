// ─────────────────────────────────────────────────────────────────────────
//  26 · sliding-window rate counter — SOLUTION             ★★★ stretch
//  run: node 26-sliding-window-counter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the closure holds one array of timestamps. Every call
//  prunes it (`now() - t < windowMs` survives), then compares its length to
//  the limit. Pruning BEFORE counting is what makes the window slide
//  instead of tick over in fixed buckets.
//  Two classic bugs: recording rejected calls — which turns a burst into a
//  permanent lockout because the array never drains — and using a plain
//  counter with a `setTimeout` reset, which gives you fixed windows and
//  lets 2×limit through across a boundary. Storing the moments, not a
//  count, is what buys you the sliding behaviour for four lines of code.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function makeRateLimiter(limit, windowMs, now = Date.now) {
  let times = [];
  return () => {
    const at = now();
    times = times.filter((t) => at - t < windowMs);
    if (times.length >= limit) return false;
    times.push(at);
    return true;
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lets the first `limit` calls through', () => {
  const allow = makeRateLimiter(3, 100, () => 0);
  eq([allow(), allow(), allow()], [true, true, true]);
});

test('blocks once the window is full', () => {
  const allow = makeRateLimiter(2, 100, () => 0);
  allow();
  allow();
  eq(allow(), false);
  eq(allow(), false);
});

test('lets a call through once the oldest one slides out', () => {
  let clock = 0;
  const allow = makeRateLimiter(2, 100, () => clock);
  allow();
  clock = 40;
  allow();
  clock = 90;
  eq(allow(), false, 'both hits are still inside the window');
  clock = 100;
  eq(allow(), true, 'the hit from 0 has aged out');
});

test('a blocked call is not recorded', () => {
  let clock = 0;
  const allow = makeRateLimiter(1, 100, () => clock);
  eq(allow(), true);
  clock = 50;
  eq(allow(), false);
  clock = 100;
  eq(allow(), true, 'the rejected call at 50 must not hold the slot');
});

test('a timestamp exactly windowMs old is outside the window', () => {
  let clock = 0;
  const allow = makeRateLimiter(1, 100, () => clock);
  allow();
  clock = 99;
  eq(allow(), false);
  clock = 100;
  eq(allow(), true);
});

test('the window slides, it does not tick over in fixed buckets', () => {
  let clock = 0;
  const allow = makeRateLimiter(2, 100, () => clock);
  allow();
  clock = 60;
  allow();
  clock = 110;
  eq(allow(), true, 'only the hit from 0 has aged out');
  eq(allow(), false, 'the hit from 60 still holds the second slot');
});

test('two limiters keep separate histories', () => {
  const clock = () => 0;
  const a = makeRateLimiter(1, 100, clock);
  const b = makeRateLimiter(1, 100, clock);
  eq(a(), true);
  eq(b(), true);
  eq(a(), false);
});

test('reads the clock on every call', () => {
  const clock = spy(() => 0);
  const allow = makeRateLimiter(5, 100, clock);
  allow();
  allow();
  ok(clock.callCount >= 2, 'the time must be sampled per call');
});
