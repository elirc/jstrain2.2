// ─────────────────────────────────────────────────────────────────────────
//  09 · function decorators                                     ★★☆ core
//  concepts: decorator · higher-order functions · composition
//  run: node exercises/09-decorator-wrappers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You need logging, timing and retries around a handful of functions —
//  and you are not allowed to edit those functions. Write wrappers that
//  take a function and return a function with the same signature.
//
//      const noisy = withLogging(add, log);
//      noisy(2, 3)   → 5, and log saw ('call', [2, 3]) then ('return', 5)
//
//      const timed = withTiming(add, record, now);
//      timed(2, 3)   → 5, and record saw (elapsed) — one number of ms,
//                      measured with the injected `now()` clock
//
//      const tough = withRetry(flaky, 3);   // async
//      await tough()  → resolves if any of the 3 attempts resolves,
//                       otherwise rejects with the LAST error
//
//  They must compose: withTiming(withLogging(fn, log), record, now).
//
//  hint: `(...args) => { ... fn(...args) ... }` — forward everything,
//  return the original result, and call the clock exactly twice

import { test, eq, rejects, spy } from '../../_lib/check.js';

export function withLogging(fn, log) {
  throw new Error('TODO');
}

export function withTiming(fn, record, now = Date.now) {
  throw new Error('TODO');
}

export function withRetry(fn, attempts) {
  throw new Error('TODO');
}

const add = (a, b) => a + b;
const fakeClock = (...times) => {
  let i = 0;
  return () => times[Math.min(i++, times.length - 1)];
};

// ──────────────────────────── tests ──────────────────────────────────────

test('withLogging passes the result through untouched', () => {
  eq(withLogging(add, spy())(2, 3), 5);
});

test('withLogging records the arguments and the return value', () => {
  const log = spy();
  withLogging(add, log)(2, 3);
  eq(log.calls, [
    ['call', [2, 3]],
    ['return', 5],
  ]);
});

test('withTiming reports elapsed ms from the injected clock', () => {
  const record = spy();
  const timed = withTiming(add, record, fakeClock(100, 142));
  eq(timed(2, 3), 5);
  eq(record.calls, [[42]]);
});

test('withTiming works with any arity', () => {
  const record = spy();
  const shout = withTiming((s) => s.toUpperCase(), record, fakeClock(0, 3));
  eq(shout('hi'), 'HI');
  eq(record.calls, [[3]]);
});

test('withRetry survives transient failures', async () => {
  const flaky = spy(async () => {
    if (flaky.callCount < 3) throw new Error('flap');
    return 'ok';
  });
  eq(await withRetry(flaky, 5)(), 'ok');
  eq(flaky.callCount, 3);
});

test('withRetry gives up after the last attempt and rethrows', async () => {
  const boom = spy(async () => {
    throw new Error(`nope ${boom.callCount}`);
  });
  const wrapped = withRetry(boom, 2);
  await rejects(() => wrapped(), 'nope 2');
  eq(boom.callCount, 2);
});

test('decorators compose without knowing about each other', () => {
  const log = spy();
  const record = spy();
  const wrapped = withTiming(withLogging(add, log), record, fakeClock(0, 5));
  eq(wrapped(2, 3), 5);
  eq(log.calls, [
    ['call', [2, 3]],
    ['return', 5],
  ]);
  eq(record.calls, [[5]]);
});
