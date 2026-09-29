// ─────────────────────────────────────────────────────────────────────────
//  04 · the test that spreads the duplicates out               ★★★ stretch
//  concepts: test design · realistic fixtures · meta-testing
//  run: node 04-dedupe-nonadjacent.js
// ─────────────────────────────────────────────────────────────────────────
//
//  dedupe(arr) should remove ALL duplicate values, keeping first
//  occurrence order: [1,2,1,3,2] → [1,2,3]. One implementation does that;
//  the other only collapses ADJACENT duplicates (like Unix `uniq`), so it
//  passes any fixture where the repeats happen to sit next to each other —
//  [1,1,2,2,3] fools it completely.
//
//  Fill in assertCorrect(dedupe). Grader: pass on the correct version,
//  fail on the buggy one. This one is about FIXTURE design: a too-tidy
//  input hides the bug.
//
//  hint: put the same value in twice with something else BETWEEN the two
//  copies. That's the arrangement `uniq`-style dedupe can't handle.

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── provided: two implementations. Do not edit them. ─────────────────────
export function correctDedupe(arr) {
  return [...new Set(arr)];
}
export function buggyDedupe(arr) {
  return arr.filter((x, i) => i === 0 || x !== arr[i - 1]); // adjacent only
}

// ── YOUR JOB: a test strong enough to tell them apart ────────────────────
export function assertCorrect(dedupe) {
  throw new Error('TODO');
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctDedupe);
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggyDedupe));
});
