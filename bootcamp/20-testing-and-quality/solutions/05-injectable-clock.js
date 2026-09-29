// ─────────────────────────────────────────────────────────────────────────
//  05 · injectable clock — SOLUTION                             ★★☆ core
//  run: node 05-injectable-clock.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Date.now()` inside a unit is a hidden global input. The
//  refactor is not clever — it is one parameter. Once the timer reads time
//  through `clock.now()`, a test owns time completely: `advance(30 * 60_000)`
//  is instant, exact, and works the same at 3am on a slow laptop.
//  The fake `sleep` is the trick worth stealing: it advances the clock and
//  returns an already-resolved promise, so `await` still yields to the
//  microtask queue (ordering stays honest) while zero real milliseconds
//  pass.
//  The boundary is the classic bug. "Expires after 30 minutes" means
//  `idle >= timeout`, not `>`. Off by one millisecond is a session that
//  outlives its own policy, and only a fake clock lets you test the exact
//  boundary at all — with the real clock you cannot land on it.
//  `remainingMs` clamps at 0 because a negative "time left" leaks into
//  progress bars and retry maths as a bug you will chase for an hour.

import { test, eq } from '../../_lib/check.js';

export function makeFakeClock(startMs = 0) {
  let current = startMs;
  return {
    now: () => current,
    advance(ms) {
      current += ms;
      return current;
    },
    async sleep(ms) {
      current += ms;
    },
  };
}

export function createSessionTimer(clock, timeoutMs) {
  let lastTouch = clock.now();
  const idleMs = () => clock.now() - lastTouch;
  return {
    touch() {
      lastTouch = clock.now();
    },
    idleMs,
    remainingMs: () => Math.max(0, timeoutMs - idleMs()),
    isExpired: () => idleMs() >= timeoutMs,
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a fake clock starts where you put it and does not drift', () => {
  const clock = makeFakeClock(1000);
  eq(clock.now(), 1000);
  eq(clock.now(), 1000);
});

test('advance moves time forward and returns the new now', () => {
  const clock = makeFakeClock(0);
  eq(clock.advance(500), 500);
  eq(clock.advance(500), 1000);
  eq(clock.now(), 1000);
});

test('sleep advances the clock and resolves without real waiting', async () => {
  const clock = makeFakeClock(0);
  const order = [];
  const done = clock.sleep(60_000).then(() => order.push('slept'));
  order.push('sync');
  await done;
  eq(order, ['sync', 'slept']);
  eq(clock.now(), 60_000);
});

test('a fresh timer is not expired and has the whole timeout left', () => {
  const clock = makeFakeClock(5000);
  const session = createSessionTimer(clock, 30_000);
  eq(session.isExpired(), false);
  eq(session.idleMs(), 0);
  eq(session.remainingMs(), 30_000);
});

test('the timer expires exactly AT the timeout, not a tick later', () => {
  const clock = makeFakeClock(0);
  const session = createSessionTimer(clock, 30_000);
  clock.advance(29_999);
  eq(session.isExpired(), false);
  clock.advance(1);
  eq(session.isExpired(), true);
});

test('touch restarts the countdown', () => {
  const clock = makeFakeClock(0);
  const session = createSessionTimer(clock, 30_000);
  clock.advance(29_000);
  session.touch();
  clock.advance(29_000);
  eq(session.isExpired(), false);
  eq(session.remainingMs(), 1000);
});

test('remainingMs clamps at zero instead of going negative', () => {
  const clock = makeFakeClock(0);
  const session = createSessionTimer(clock, 1000);
  clock.advance(10_000);
  eq(session.remainingMs(), 0);
  eq(session.idleMs(), 10_000);
});

test('two timers share one clock without interfering', () => {
  const clock = makeFakeClock(0);
  const short = createSessionTimer(clock, 1000);
  const long = createSessionTimer(clock, 60_000);
  clock.advance(2000);
  eq(short.isExpired(), true);
  eq(long.isExpired(), false);
  short.touch();
  eq(short.isExpired(), false);
  eq(long.idleMs(), 2000);
});
