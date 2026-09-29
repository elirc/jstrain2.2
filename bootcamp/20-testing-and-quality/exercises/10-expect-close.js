// ─────────────────────────────────────────────────────────────────────────
//  10 · expectClose                                             ★★☆ core
//  concepts: assertion design · floats · failure messages
//  run: node 10-expect-close.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `ok(Math.abs(a - b) < 0.01)` is a passing test and a useless failure.
//  Write the assertion you would want to read at 2am: it names both values,
//  the tolerance, AND how far off you actually were.
//
//      expectClose(0.1 + 0.2, 0.3)      → passes (default tolerance 1e-9)
//      expectClose(1.5, 1, 0.5)         → passes (the boundary is INSIDE)
//      expectClose(0.5, 0.25, 0.1)      → throws
//          'expected 0.5 to be within 0.1 of 0.25 (off by 0.25)'
//      expectClose('3', 3)              → throws
//          'expected a number, got string'
//
//  Exact template, both values raw (no rounding, no toFixed):
//      `expected ${actual} to be within ${tolerance} of ${expected} ` +
//      `(off by ${off})`          // off = Math.abs(actual - expected)
//
//  Two values you must think about: Infinity is close to itself, and NaN is
//  close to NOTHING — not even to NaN.
//
//  hint: check the types first, then take a shortcut for identical values,
//  then compare the difference. `Object.is` handles the Infinity case but
//  has an opinion about NaN that you do not share.

import { test, eq, ok } from '../../_lib/check.js';

// Provided: run fn, return the message it threw, or null if it did not.
// TODO errors are re-thrown so unwritten code still reports as "todo".
function messageFrom(fn) {
  try {
    fn();
  } catch (error) {
    if (/^TODO\b/.test(error.message)) throw error;
    return error.message;
  }
  return null;
}

export function expectClose(actual, expected, tolerance = 1e-9) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('exactly equal numbers pass quietly', () => {
  eq(messageFrom(() => expectClose(3, 3)), null);
  eq(messageFrom(() => expectClose(-0.5, -0.5, 0)), null);
});

test('float noise inside the default tolerance passes', () => {
  eq(messageFrom(() => expectClose(0.1 + 0.2, 0.3)), null);
});

test('a real difference throws', () => {
  ok(messageFrom(() => expectClose(3.2, 3, 0.1)) !== null);
  ok(messageFrom(() => expectClose(0.1 + 0.2, 0.3, 0)) !== null);
});

test('the message names both values, the tolerance and the miss', () => {
  eq(
    messageFrom(() => expectClose(0.5, 0.25, 0.1)),
    'expected 0.5 to be within 0.1 of 0.25 (off by 0.25)'
  );
});

test('the tolerance is inclusive at the boundary', () => {
  eq(messageFrom(() => expectClose(1.5, 1, 0.5)), null);
  ok(messageFrom(() => expectClose(1.6, 1, 0.5)) !== null);
});

test('NaN is never close to anything, not even to NaN', () => {
  ok(messageFrom(() => expectClose(NaN, NaN, 10)) !== null);
  ok(messageFrom(() => expectClose(NaN, 1, 10)) !== null);
  ok(messageFrom(() => expectClose(1, NaN, 10)) !== null);
});

test('Infinity is close to itself but not to a finite number', () => {
  eq(messageFrom(() => expectClose(Infinity, Infinity)), null);
  ok(messageFrom(() => expectClose(Infinity, 1e308)) !== null);
});

test('a non-number is rejected with a type message', () => {
  eq(messageFrom(() => expectClose('3', 3)), 'expected a number, got string');
  eq(messageFrom(() => expectClose(3, null)), 'expected a number, got object');
  eq(
    messageFrom(() => expectClose(undefined, 3)),
    'expected a number, got undefined'
  );
});
