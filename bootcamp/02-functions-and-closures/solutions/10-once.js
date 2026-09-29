// ─────────────────────────────────────────────────────────────────────────
//  10 · once — SOLUTION                                    ★★☆ core
//  run: node 10-once.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two captured variables — a boolean flag and the cached
//  result. The flag is what makes the "returns undefined" case work: the
//  tempting `if (result === undefined) result = fn(...)` re-runs the
//  function forever whenever it legitimately returns undefined (or null,
//  or 0, if you test truthiness). Rest + spread forwards the arguments
//  untouched, and every call to once() creates a fresh pair of variables,
//  so two wrappers never interfere.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a function', () => {
  const guarded = once(() => 1);
  ok(typeof guarded === 'function');
});

test('runs the wrapped function on the first call only', () => {
  const fn = spy(() => 'ok');
  const guarded = once(fn);
  guarded();
  guarded();
  guarded();
  eq(fn.callCount, 1);
});

test('hands back the first result every time', () => {
  let n = 0;
  const guarded = once(() => (n += 1));
  eq(guarded(), 1);
  eq(guarded(), 1);
  eq(guarded(), 1);
});

test('forwards the first call arguments', () => {
  const fn = spy((host, port) => `${host}:${port}`);
  const guarded = once(fn);
  eq(guarded('db', 5432), 'db:5432');
  eq(fn.calls, [['db', 5432]]);
});

test('ignores the arguments of later calls', () => {
  const fn = spy((label) => label);
  const guarded = once(fn);
  eq(guarded('first'), 'first');
  eq(guarded('second'), 'first');
  eq(fn.callCount, 1);
});

test('caches an undefined result instead of re-running', () => {
  const fn = spy(() => undefined);
  const guarded = once(fn);
  eq(guarded(), undefined);
  eq(guarded(), undefined);
  eq(fn.callCount, 1);
});

test('each wrapper has its own state', () => {
  const fn = spy((x) => x);
  const a = once(fn);
  const b = once(fn);
  eq(a('a'), 'a');
  eq(b('b'), 'b');
  eq(a('again'), 'a');
  eq(fn.callCount, 2);
});
