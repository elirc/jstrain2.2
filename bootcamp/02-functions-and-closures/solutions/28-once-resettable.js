// ─────────────────────────────────────────────────────────────────────────
//  28 · once, with a reset — SOLUTION                      ★★☆ core
//  run: node 28-once-resettable.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the wrapper and `reset` are two closures over one pair of
//  variables — that shared environment is the whole mechanism. Because
//  functions are objects you can attach `reset` directly, so callers pass
//  around a single value instead of a `{ run, reset }` pair.
//  Two traps. First, resetting only the flag leaves the stale result in
//  place; if your code returns `result` before recomputing, or you forget
//  to clear it, a cached `undefined` from the first run can leak back.
//  Second, `return Object.assign(guarded, { reset })` and the plain
//  property assignment are equivalent here — pick either, but do it before
//  returning, not on a copy of the function.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function onceWithReset(fn) {
  let called = false;
  let result;
  const guarded = (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
  guarded.reset = () => {
    called = false;
    result = undefined;
  };
  return guarded;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a function that carries a reset method', () => {
  const boot = onceWithReset(() => 1);
  ok(typeof boot === 'function');
  ok(typeof boot.reset === 'function');
});

test('runs the wrapped function once until it is reset', () => {
  const fn = spy(() => 'connected');
  const boot = onceWithReset(fn);
  eq(boot(), 'connected');
  eq(boot(), 'connected');
  eq(fn.callCount, 1);
});

test('reset opens the guard again', () => {
  let n = 0;
  const boot = onceWithReset(() => (n += 1));
  eq(boot(), 1);
  eq(boot(), 1);
  boot.reset();
  eq(boot(), 2);
  eq(boot(), 2);
});

test('the first call after a reset supplies the arguments', () => {
  const fn = spy((label) => label);
  const boot = onceWithReset(fn);
  eq(boot('first'), 'first');
  eq(boot('ignored'), 'first');
  boot.reset();
  eq(boot('second'), 'second');
  eq(fn.calls, [['first'], ['second']]);
});

test('reset clears the cached result, even when it was undefined', () => {
  const fn = spy(() => undefined);
  const boot = onceWithReset(fn);
  eq(boot(), undefined);
  eq(boot(), undefined);
  eq(fn.callCount, 1);
  boot.reset();
  eq(boot(), undefined);
  eq(fn.callCount, 2);
});

test('resetting before the first call changes nothing', () => {
  const fn = spy(() => 'ok');
  const boot = onceWithReset(fn);
  boot.reset();
  eq(boot(), 'ok');
  eq(boot(), 'ok');
  eq(fn.callCount, 1);
});

test('each wrapper resets independently', () => {
  const fn = spy((x) => x);
  const a = onceWithReset(fn);
  const b = onceWithReset(fn);
  a('a');
  b('b');
  a.reset();
  a('a again');
  eq(b('b again'), 'b', 'resetting a must not touch b');
  eq(fn.callCount, 3);
});
