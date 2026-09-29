// ─────────────────────────────────────────────────────────────────────────
//  12 · the lastIndex trap — SOLUTION                           ★★☆ core
//  run: node 12-lastindex-trap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: with the g flag, test() and exec() resume from
//  re.lastIndex and park a new cursor after each hit — so a shared regex
//  remembers the LAST call and lies to the next one. Two cures:
//    looksLikeId sets ID_PATTERN.lastIndex = 0 before testing, which
//    makes each call independent again;
//    countAll uses String#match, which with a g regex resets lastIndex
//    itself and returns all matches (or null → 0 here).
//  The third cure, best when you can: do not share the object at all —
//  build the regex inside the function, or drop the g flag when you only
//  need a yes/no answer, because lastIndex is ignored without it.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding — a shared, global-flagged regex. Do not change it.
export const ID_PATTERN = /[a-z]\d{3}/g;

export function looksLikeId(text) {
  ID_PATTERN.lastIndex = 0;
  return ID_PATTERN.test(text);
}

export function countAll(text) {
  return (text.match(ID_PATTERN) ?? []).length;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('looksLikeId accepts a valid id', () => {
  eq(looksLikeId('a123'), true);
});

test('looksLikeId gives the same answer three calls in a row', () => {
  eq(looksLikeId('a123'), true);
  eq(looksLikeId('a123'), true);
  eq(looksLikeId('a123'), true);
});

test('looksLikeId rejects a non-id', () => {
  eq(looksLikeId('abc'), false);
  eq(looksLikeId('12'), false);
});

test('looksLikeId still works right after a rejection', () => {
  eq(looksLikeId('nope'), false);
  eq(looksLikeId('z999'), true);
});

test('countAll counts every id in the text', () => {
  eq(countAll('a123 b456 c789'), 3);
});

test('countAll is repeatable', () => {
  eq(countAll('a123 b456'), 2);
  eq(countAll('a123 b456'), 2);
});

test('countAll returns 0 when nothing matches', () => {
  eq(countAll('no ids here'), 0);
});

test('the two functions do not poison each other', () => {
  eq(countAll('a123 b456'), 2);
  eq(looksLikeId('a123'), true);
  eq(countAll('a123 b456'), 2);
});
