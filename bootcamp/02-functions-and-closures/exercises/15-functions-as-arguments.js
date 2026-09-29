// ─────────────────────────────────────────────────────────────────────────
//  15 · functions as arguments                             ★★☆ core
//  concepts: higher-order functions · callbacks · spies
//  run: node 15-functions-as-arguments.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The other half of higher-order programming: functions that TAKE a
//  function. Three small control-flow helpers.
//
//      times(3, (i) => i * 2)      → [0, 2, 4]   (fn gets the index)
//      times(0, fn)                → []          (fn never runs)
//
//      unless(false, () => 'ran')  → 'ran'       (runs when falsy)
//      unless(true,  () => 'ran')  → undefined   (fn never runs)
//
//      tap(5, console.log)         → 5           (value passes through)
//
//  tap calls fn with the value for its side effect and returns the
//  ORIGINAL value, whatever fn returns.
//
//  hint: `times` is a loop that collects results; `unless` is `if` with
//  the condition flipped

import { test, eq, ok, spy } from '../../_lib/check.js';

export function times(count, fn) {
  throw new Error('TODO');
}

export function unless(condition, fn) {
  throw new Error('TODO');
}

export function tap(value, fn) {
  throw new Error('TODO');
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
