// ─────────────────────────────────────────────────────────────────────────
//  03 · the test that lands on the boundary — SOLUTION         ★★★ stretch
//  concepts: test design · boundary values · meta-testing
//  run: node 03-in-range-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The bug is exclusive-vs-inclusive comparison, so it is invisible
//  everywhere EXCEPT the two endpoints. A test that only checks a value
//  in the middle (5 in [1,10]) and one far outside (99) passes both
//  implementations. The strong test asserts n === lo and n === hi are
//  IN, and lo-1 / hi+1 are OUT — boundary-value analysis.
//  The lesson: off-by-one and comparison bugs cluster on boundaries, so
//  that's where tests must stand. For any range or threshold, test the
//  value ON it and the values one step either side. "It works for 5" tells
//  you nothing about whether 1 and 10 are handled — and those are the
//  only inputs the bug could ever affect.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function correctInRange(n, lo, hi) {
  return n >= lo && n <= hi;
}
export function buggyInRange(n, lo, hi) {
  return n > lo && n < hi;
}

export function assertCorrect(inRange) {
  eq(inRange(5, 1, 10), true); // interior — agrees with buggy
  eq(inRange(1, 1, 10), true); // lower boundary is IN
  eq(inRange(10, 1, 10), true); // upper boundary is IN
  eq(inRange(0, 1, 10), false); // just outside
  eq(inRange(11, 1, 10), false);
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctInRange);
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggyInRange));
});
