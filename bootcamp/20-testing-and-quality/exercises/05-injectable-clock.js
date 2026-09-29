// ─────────────────────────────────────────────────────────────────────────
//  05 · injectable clock                                        ★★☆ core
//  concepts: dependency injection · determinism · boundaries
//  run: node 05-injectable-clock.js
// ─────────────────────────────────────────────────────────────────────────
//
//  This session timer cannot be tested, and it is not the timer's fault:
//
//      let lastTouch = Date.now();                 // untestable
//      const isExpired = () => Date.now() - lastTouch >= 30 * 60_000;
//
//  To test "expires after 30 minutes" you would have to wait 30 minutes.
//  Inject the clock instead — a two-method interface, `{ now, sleep }` —
//  and time becomes a value the test controls.
//
//      const clock = makeFakeClock(0);
//      clock.now()                    → 0
//      clock.advance(500)             → 500     (returns the new now)
//      await clock.sleep(60_000)      → resolves at once, now() is 60_000
//
//      const s = createSessionTimer(clock, 30_000);
//      s.idleMs() / s.remainingMs() / s.isExpired() / s.touch()
//
//  "Expires after 30_000ms" means idle >= 30_000. remainingMs never goes
//  below 0. The timer counts from creation until the first touch().
//
//  hint: the fake `sleep` should move the clock and return an already
//  resolved promise — awaiting still yields, but no real time passes.

import { test, eq } from '../../_lib/check.js';

export function makeFakeClock(startMs = 0) {
  throw new Error('TODO');
}

export function createSessionTimer(clock, timeoutMs) {
  throw new Error('TODO');
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
