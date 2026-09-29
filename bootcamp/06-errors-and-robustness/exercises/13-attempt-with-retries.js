// ─────────────────────────────────────────────────────────────────────────
//  13 · attempt with retries                                  ★★☆ core
//  concepts: retry loops · observability callbacks
//  run: node 13-attempt-with-retries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Some operations fail for a moment and then work: a locked file, a
//  flaky read, a busy port. Retrying is fine — retrying SILENTLY is not,
//  because a system that always succeeds on attempt 4 looks healthy right
//  up until it doesn't.
//
//    attempt(fn, retries, onError)
//      - call fn(); return its value the moment it works
//      - on a throw, call onError(error, attemptNumber) — 1-based —
//        and try again
//      - `retries` counts the EXTRA attempts, so retries: 2 means up to
//        three calls
//      - when they are all used up, throw the LAST error
//      - onError is optional
//
//      attempt(() => 'ok', 3)              → 'ok'   (fn called once)
//      attempt(failsTwiceThenWorks, 3)     → the value, fn called 3x
//      attempt(alwaysFails, 2, log)        → throws the 3rd error
//
//  hint: `onError?.(err, n)` calls it only when it was supplied.

import { test, eq, spy } from '../../_lib/check.js';

export function attempt(fn, retries, onError) {
  throw new Error('TODO');
}

// ── test fixtures & helpers ──────────────────────────────────────────────

// fails `failures` times with 'fail 1', 'fail 2', ... then returns value
function flaky(failures, value) {
  let calls = 0;
  return () => {
    calls += 1;
    if (calls <= failures) throw new Error(`fail ${calls}`);
    return value;
  };
}

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the value on the first try', () => {
  eq(attempt(() => 'connected', 3), 'connected');
});

test('does not retry or report anything when it works', () => {
  const fn = spy(() => 'connected');
  const onError = spy();
  attempt(fn, 3, onError);
  eq(fn.callCount, 1);
  eq(onError.callCount, 0);
});

test('keeps trying until it succeeds', () => {
  const fn = spy(flaky(2, 'connected'));
  eq(attempt(fn, 3, spy()), 'connected');
  eq(fn.callCount, 3);
});

test('reports every failure with a 1-based attempt number', () => {
  const onError = spy();
  attempt(flaky(2, 'connected'), 3, onError);
  eq(onError.callCount, 2);
  eq(onError.calls.map((args) => args[1]), [1, 2]);
  eq(onError.calls[0][0].message, 'fail 1');
});

test('gives up and throws the LAST error', () => {
  const err = thrownBy(() => attempt(flaky(99, 'never'), 2, spy()));
  eq(err.message, 'fail 3');
});

test('retries: 0 means exactly one attempt', () => {
  const fn = spy(flaky(99, 'never'));
  const err = thrownBy(() => attempt(fn, 0));
  eq(fn.callCount, 1);
  eq(err.message, 'fail 1');
});

test('onError is optional', () => {
  eq(attempt(flaky(1, 'connected'), 2), 'connected');
});
