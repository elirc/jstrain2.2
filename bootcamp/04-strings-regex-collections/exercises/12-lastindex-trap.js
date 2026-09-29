// ─────────────────────────────────────────────────────────────────────────
//  12 · the lastIndex trap                                      ★★☆ core
//  concepts: the g flag · regex.lastIndex · statefulness
//  run: node 12-lastindex-trap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A regex object with the g flag is STATEFUL. Every .test() that hits
//  parks a cursor (re.lastIndex) after the match, and the next .test()
//  resumes from there — so the same input flips between true and false:
//
//      const RE = /[a-z]\d{3}/g;
//      RE.test('a123')  → true    (lastIndex is now 4)
//      RE.test('a123')  → false   (searched from index 4: nothing)
//
//  ID_PATTERN below is shared and global on purpose. Make both functions
//  give the same answer no matter how often they are called.
//
//      looksLikeId('a123')  → true, every single time
//      countAll('a123 b456 c789')  → 3, every single time
//
//  hint: either reset re.lastIndex to 0 yourself, or use String#match(re)
//  — with a g regex it starts from 0 and hands back all matches or null.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding — a shared, global-flagged regex. Do not change it.
export const ID_PATTERN = /[a-z]\d{3}/g;

export function looksLikeId(text) {
  throw new Error('TODO');
}

export function countAll(text) {
  throw new Error('TODO');
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
