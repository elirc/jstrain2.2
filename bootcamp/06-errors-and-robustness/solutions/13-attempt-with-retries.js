// ─────────────────────────────────────────────────────────────────────────
//  13 · attempt with retries — SOLUTION                       ★★☆ core
//  run: node 13-attempt-with-retries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the loop runs `retries + 1` times because the first call
//  is not a retry. `return fn()` inside the try is the only exit on
//  success, so the moment it works the loop is over. Every failure is
//  remembered in `lastError` and handed to onError; if the loop finishes,
//  the last error is thrown — never a fresh 'all retries failed' Error,
//  which would erase the real reason.
//  `onError?.(...)` is optional chaining on a call: it skips the call
//  when onError is undefined instead of blowing up.
//  Classic wrong turn: retrying everything. A 'file is locked' error is
//  worth a second try; a ValidationError will fail identically three
//  times and just delays the answer. Real retry loops check the error
//  first, and back off between attempts.

import { test, eq, spy } from '../../_lib/check.js';

export function attempt(fn, retries, onError) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return fn();
    } catch (err) {
      lastError = err;
      onError?.(err, i + 1);
    }
  }
  throw lastError;
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
