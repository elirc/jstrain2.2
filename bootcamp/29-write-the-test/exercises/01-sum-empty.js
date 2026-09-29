// ─────────────────────────────────────────────────────────────────────────
//  01 · write the test that catches the empty case               ★★☆ core
//  concepts: test design · edge cases · meta-testing
//  run: node 01-sum-empty.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The inverse of a debug hunt: you don't fix the bug, you WRITE THE TEST
//  that would have caught it. Below are two implementations of sum(nums):
//  one correct, one buggy. They behave IDENTICALLY on the obvious inputs
//  — the bug only shows on an edge.
//
//  Fill in assertCorrect(sum): call the passed-in sum with inputs of your
//  choosing and throw (via eq/ok, or your own throw) if it ever
//  misbehaves. The grader runs YOUR test twice:
//    · against the correct sum — it must PASS (not throw)
//    · against the buggy sum   — it must FAIL (throw)
//  A test that passes both is too weak; that's the lesson — a green suite
//  proves nothing if it never exercised the case that breaks.
//
//  hint: where do sum([1,2,3]) and a naive reduce agree, and where might
//  they diverge? What is the smallest, emptiest input you can hand it?

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── provided: two implementations. Do not edit them. ─────────────────────
export function correctSum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}
export function buggySum(nums) {
  return nums.reduce((a, b) => a + b); // no seed: throws on []
}

// ── YOUR JOB: a test strong enough to tell them apart ────────────────────
export function assertCorrect(sum) {
  throw new Error('TODO');
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctSum); // must not throw
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggySum)); // your test must catch the bug
});
