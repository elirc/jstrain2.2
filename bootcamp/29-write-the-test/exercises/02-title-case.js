// ─────────────────────────────────────────────────────────────────────────
//  02 · the test that reads past the first word                  ★★☆ core
//  concepts: test design · edge cases · meta-testing
//  run: node 02-title-case.js
// ─────────────────────────────────────────────────────────────────────────
//
//  titleCase(str) should capitalize the first letter of EVERY word:
//  'hello world' → 'Hello World'. One implementation below does that; the
//  other only capitalizes the first word. On a single-word input they are
//  identical — which is exactly the test a tired author writes.
//
//  Fill in assertCorrect(titleCase). The grader runs it against the
//  correct version (must pass) and the buggy one (must fail). Write the
//  test that a one-word check would have missed.
//
//  hint: the bug hides whenever there's more than one word. Pick an input
//  that forces the function to prove it handles all of them.

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── provided: two implementations. Do not edit them. ─────────────────────
export function correctTitle(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
export function buggyTitle(str) {
  return str.charAt(0).toUpperCase() + str.slice(1); // first word only
}

// ── YOUR JOB: a test strong enough to tell them apart ────────────────────
export function assertCorrect(titleCase) {
  throw new Error('TODO');
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctTitle);
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggyTitle));
});
