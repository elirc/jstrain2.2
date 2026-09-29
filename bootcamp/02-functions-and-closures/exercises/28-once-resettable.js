// ─────────────────────────────────────────────────────────────────────────
//  28 · once, with a reset                                 ★★☆ core
//  concepts: closures · guards · function properties
//  run: node 28-once-resettable.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `once` is perfect until a test suite needs to run the same bootstrap
//  again, or a user logs out and the "load my profile" guard has to open
//  back up. Give the wrapper an escape hatch: a `reset()` hanging off the
//  returned function itself.
//
//      const boot = onceWithReset(connect);
//      boot()          → 'connected'   (connect ran)
//      boot()          → 'connected'   (cached — connect did NOT run)
//      boot.reset()
//      boot()          → 'connected'   (connect ran a second time)
//
//  A function is an object, so `boot.reset = ...` is legal and gives you a
//  one-handle API. After a reset the cached result must be gone too, not
//  just the "already ran" flag.
//
//  hint: write the two closure variables first, then hang a second closure
//  over the SAME variables on the returned function before you return it

import { test, eq, ok, spy } from '../../_lib/check.js';

export function onceWithReset(fn) {
  throw new Error('TODO');
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
