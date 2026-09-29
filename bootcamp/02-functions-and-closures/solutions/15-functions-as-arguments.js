// ─────────────────────────────────────────────────────────────────────────
//  15 · functions as arguments — SOLUTION                  ★★☆ core
//  run: node 15-functions-as-arguments.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: passing a function lets the CALLER decide the work while
//  the helper decides the control flow — that is all a callback is.
//  `times` builds the array with Array.from's map argument, which calls
//  the function with each index. `unless` returns the callback's value so
//  it composes in an expression; when it skips, the implicit undefined is
//  the answer. `tap` is the odd one: it deliberately throws away the
//  callback's return value so it can be dropped into any pipeline
//  without changing it.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function times(count, fn) {
  return Array.from({ length: count }, (_, i) => fn(i));
}

export function unless(condition, fn) {
  if (!condition) return fn();
  return undefined;
}

export function tap(value, fn) {
  fn(value);
  return value;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('times calls the function once per index', () => {
  const fn = spy((i) => i);
  times(3, fn);
  eq(fn.callCount, 3);
  eq(fn.calls, [[0], [1], [2]]);
});

test('times collects the results in order', () => {
  eq(times(3, (i) => i * 2), [0, 2, 4]);
  eq(times(2, () => 'x'), ['x', 'x']);
});

test('times with a count of zero never calls the function', () => {
  const fn = spy(() => 'nope');
  eq(times(0, fn), []);
  eq(fn.callCount, 0);
});

test('unless runs the function when the condition is falsy', () => {
  const fn = spy(() => 'ran');
  eq(unless(false, fn), 'ran');
  eq(unless(0, fn), 'ran');
  eq(fn.callCount, 2);
});

test('unless skips the function when the condition is truthy', () => {
  const fn = spy(() => 'ran');
  eq(unless(true, fn), undefined);
  eq(unless('yes', fn), undefined);
  eq(fn.callCount, 0);
});

test('unless calls the function with no arguments', () => {
  const fn = spy(() => 'ran');
  unless(false, fn);
  eq(fn.calls, [[]]);
});

test('tap returns the value and hands it to the callback', () => {
  const fn = spy(() => 'ignored');
  eq(tap(5, fn), 5);
  eq(fn.calls, [[5]]);
});

test('tap passes objects through untouched', () => {
  const user = { name: 'Ada' };
  const seen = [];
  ok(tap(user, (u) => seen.push(u.name)) === user, 'same object back');
  eq(seen, ['Ada']);
});
