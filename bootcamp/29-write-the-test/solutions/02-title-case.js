// ─────────────────────────────────────────────────────────────────────────
//  02 · the test that reads past the first word — SOLUTION        ★★☆ core
//  concepts: test design · edge cases · meta-testing
//  run: node 02-title-case.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  A single-word fixture ('hello' → 'Hello') passes BOTH implementations,
//  because the bug — capitalizing only the first word — is invisible
//  until there are two words. The strong test uses a multi-word input, so
//  the second word's capital is what separates correct from buggy.
//  The lesson: a fixture must contain the STRUCTURE the function operates
//  on. "Title-case each word" is a claim about many words; test it with
//  one word and you've tested a different, easier function. Match the
//  fixture's shape to the behavior's shape — collections need >1 element,
//  string transforms need the repeated structure, trees need depth.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function correctTitle(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
export function buggyTitle(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function assertCorrect(titleCase) {
  eq(titleCase('hello'), 'Hello'); // agrees with buggy — not enough alone
  eq(titleCase('hello world'), 'Hello World'); // forces every word
  eq(titleCase('the quick brown fox'), 'The Quick Brown Fox');
}

// ──────────────────────── meta-tests (do not edit) ───────────────────────

test('your test accepts the correct implementation', () => {
  assertCorrect(correctTitle);
});

test('your test rejects the buggy implementation', () => {
  throws(() => assertCorrect(buggyTitle));
});
