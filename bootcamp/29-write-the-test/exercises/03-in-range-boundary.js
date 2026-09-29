// ─────────────────────────────────────────────────────────────────────────
//  03 · the test that lands on the boundary                   ★★★ stretch
//  concepts: test design · boundary values · meta-testing
//  run: node 03-in-range-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  inRange(n, lo, hi) is INCLUSIVE: n may equal lo or hi. One
//  implementation gets that right; the other uses strict `<`/`>` and so
//  rejects the endpoints. For any n strictly inside the range they agree
//  — the difference lives exactly on lo and hi.
//
//  Fill in assertCorrect(inRange). Grader: pass on the correct version,
//  fail on the buggy one. Off-by-one bugs live on boundaries, so your
//  test has to stand on them.
//
//  hint: don't just test the middle. Test n === lo and n === hi — and,
//  for full coverage, one value just outside each end.

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── provided: two implementations. Do not edit them. ─────────────────────
export function correctInRange(n, lo, hi) {
  return n >= lo && n <= hi;
}
export function buggyInRange(n, lo, hi) {
  return n > lo && n < hi; // excludes the endpoints
}

// ── YOUR JOB: a test strong enough to tell them apart ────────────────────
export function assertCorrect(inRange) {
  throw new Error('TODO');
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctInRange);
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggyInRange));
});
