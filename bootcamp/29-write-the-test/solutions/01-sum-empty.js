// ─────────────────────────────────────────────────────────────────────────
//  01 · write the test that catches the empty case — SOLUTION     ★★☆ core
//  concepts: test design · edge cases · meta-testing
//  run: node 01-sum-empty.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The whole test rides on one line: sum([]) must be 0. reduce WITHOUT a
//  seed throws on an empty array, so a suite that only ever sums
//  non-empty lists is green and useless. The strong test asserts the
//  empty case (and a normal case, so it doesn't accept something that
//  returns 0 for everything).
//  The lesson: coverage is not "lines executed", it's "cases that could
//  break, exercised". The empty collection, the single element, the
//  zero, the negative, the duplicate — these are where bugs live, and a
//  fixture of [1,2,3] visits none of them. Before writing a test, ask
//  "what's the emptiest / largest / weirdest input this must survive?"
//  and put THAT in the fixture.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function correctSum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}
export function buggySum(nums) {
  return nums.reduce((a, b) => a + b);
}

export function assertCorrect(sum) {
  eq(sum([1, 2, 3]), 6); // a normal case, so 'return 0' can't pass
  eq(sum([]), 0); // the edge the bug lives on
  eq(sum([5]), 5);
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctSum);
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggySum));
});
