// ─────────────────────────────────────────────────────────────────────────
//  10 · expectClose — SOLUTION                                  ★★☆ core
//  run: node 10-expect-close.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an assertion is a function that throws a GOOD SENTENCE.
//  `ok(Math.abs(a - b) < 0.01)` is technically the same check and tells you
//  nothing at 2am: not the values, not the tolerance, not how far off you
//  were. Every one of those three is in the message here, and "off by" is
//  the one people forget — it is the difference between "adjust the
//  tolerance" and "the algorithm is wrong".
//  Order of checks is the design. Types first, so `expectClose('3', 3)`
//  reports a type mistake instead of `NaN` nonsense. Then `Object.is`, so
//  Infinity is close to itself (`Infinity - Infinity` is NaN, and NaN <= eps
//  is false — without this line the honest case fails).
//  And `Object.is` needs the NaN guard, because `Object.is(NaN, NaN)` is
//  `true` while "NaN is close to NaN" must be FALSE. Excluded from the
//  shortcut, NaN takes the normal path, `off` is NaN, and the comparison
//  fails on its own. Both facts are true at once and you have to pick.
//  `messageFrom` is provided and worth stealing: assert on the MESSAGE, not
//  just on the fact that something threw. A test that only checks "it
//  threw" passes when your assertion throws a TypeError from its own bug.

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
  if (typeof actual !== 'number') {
    throw new Error(`expected a number, got ${typeof actual}`);
  }
  if (typeof expected !== 'number') {
    throw new Error(`expected a number, got ${typeof expected}`);
  }
  if (Object.is(actual, expected) && !Number.isNaN(actual)) return;
  const off = Math.abs(actual - expected);
  if (off <= tolerance) return;
  throw new Error(
    `expected ${actual} to be within ${tolerance} of ${expected} ` +
      `(off by ${off})`
  );
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
