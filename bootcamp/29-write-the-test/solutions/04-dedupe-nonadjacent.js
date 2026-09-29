// ─────────────────────────────────────────────────────────────────────────
//  04 · the test that spreads the duplicates out — SOLUTION    ★★★ stretch
//  concepts: test design · realistic fixtures · meta-testing
//  run: node 04-dedupe-nonadjacent.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The buggy dedupe only collapses ADJACENT repeats, so any fixture where
//  the duplicates sit together ([1,1,2,2,3]) passes it. The strong test
//  separates the copies — [1,2,1,3,2] — so a value must be remembered
//  across other values, which adjacency-only dedupe cannot do. It also
//  pins first-occurrence order, so a "sort then dedupe" cheat can't pass.
//  The lesson: fixtures that are too ORDERLY hide bugs. Real data is
//  messy — duplicates scattered, items out of order, cases interleaved —
//  and a test built from a neatly grouped example quietly assumes the
//  input is neatly grouped. Design the fixture to be as adversarial as
//  the real input, not as convenient as the happy path.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function correctDedupe(arr) {
  return [...new Set(arr)];
}
export function buggyDedupe(arr) {
  return arr.filter((x, i) => i === 0 || x !== arr[i - 1]);
}

export function assertCorrect(dedupe) {
  eq(dedupe([1, 1, 2, 2, 3]), [1, 2, 3]); // adjacent — agrees with buggy
  eq(dedupe([1, 2, 1, 3, 2]), [1, 2, 3]); // scattered — only correct passes
  eq(dedupe([3, 1, 3, 1]), [3, 1]); // keeps first-seen order
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctDedupe);
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggyDedupe));
});
