// ─────────────────────────────────────────────────────────────────────────
//  15 · closures in loops                                    ★★★ stretch
//  concepts: closures · per-iteration bindings · private state
//  run: node 15-loop-closures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The most famous JavaScript bug: build functions inside a `var` loop
//  and every one of them sees the SAME variable, holding its final value.
//
//      // with var:  [3, 3, 3]      // with let:  [0, 1, 2]
//
//  captureIndexes(list) → one function per item; calling function i
//  returns i.
//
//      captureIndexes(['a', 'b', 'c']).map((f) => f())  → [0, 1, 2]
//
//  makeCounters(n) → n counters, each with its OWN count. Calling one
//  returns its new total, starting at 1.
//
//      const [first, second] = makeCounters(2);
//      first()   → 1
//      first()   → 2
//      second()  → 1        // untouched by first
//
//  hint: `let` in a for-header gives every iteration a fresh binding.
//  Independent state comes from declaring the variable INSIDE the
//  function that builds each counter.

import { test, eq, ok } from '../../_lib/check.js';

export function captureIndexes(list) {
  throw new Error('TODO');
}

export function makeCounters(count) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('captureIndexes returns one function per item', () => {
  const fns = captureIndexes(['a', 'b', 'c']);
  eq(fns.length, 3);
  ok(typeof fns[0] === 'function');
});

test('each captured function reports its own index', () => {
  eq(
    captureIndexes(['a', 'b', 'c']).map((f) => f()),
    [0, 1, 2]
  );
});

test('the last index is not smeared over all of them', () => {
  const fns = captureIndexes([10, 20, 30, 40]);
  eq(fns[0](), 0);
  eq(fns[3](), 3);
});

test('an empty list produces no functions', () => {
  eq(captureIndexes([]), []);
  eq(makeCounters(0), []);
});

test('a counter starts at 1 and keeps climbing', () => {
  const [tick] = makeCounters(1);
  eq(tick(), 1);
  eq(tick(), 2);
  eq(tick(), 3);
});

test('counters do not share state', () => {
  const [first, second] = makeCounters(2);
  first();
  first();
  eq(second(), 1);
  eq(first(), 3);
});

test('each call to makeCounters starts a fresh set', () => {
  const [a] = makeCounters(1);
  a();
  a();
  const [b] = makeCounters(1);
  eq(b(), 1);
  eq(a(), 3);
});
