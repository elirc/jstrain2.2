// ─────────────────────────────────────────────────────────────────────────
//  10 · anchors and validators                                  ★★☆ core
//  concepts: ^ and $ anchors · alternation · {n} quantifiers · flags
//  run: node 10-anchors-and-validators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A regex without anchors answers "does this appear ANYWHERE?". A
//  validator has to answer "is the WHOLE string this?" — that is what
//  ^ (start) and $ (end) are for.
//
//      isHexColor('#a3f2b1')       → true
//      isHexColor('#FFF')          → true    (3-digit shorthand, any case)
//      isHexColor('say #fff here') → false   (anchors!)
//      isHexColor('#ff')           → false
//
//      isIdentifier('user_name2')  → true
//      isIdentifier('2fast')       → false   (cannot start with a digit)
//      isIdentifier('user-name')   → false
//
//  A hex colour is '#' then exactly 3 or 6 hex digits. An identifier is a
//  letter or underscore, then any number of letters, digits, underscores.
//
//  hint: {3} means "exactly three", (a|b) means "this or that", and the
//  i flag makes the whole pattern case-insensitive.

import { test, eq } from '../../_lib/check.js';

export function isHexColor(text) {
  throw new Error('TODO');
}

export function isIdentifier(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('isHexColor accepts a 6-digit colour', () => {
  eq(isHexColor('#a3f2b1'), true);
  eq(isHexColor('#000000'), true);
});

test('isHexColor accepts the 3-digit shorthand in any case', () => {
  eq(isHexColor('#FFF'), true);
  eq(isHexColor('#0aF'), true);
});

test('isHexColor rejects a colour buried in a sentence', () => {
  eq(isHexColor('say #fff please'), false);
  eq(isHexColor('#fff!'), false);
});

test('isHexColor rejects the wrong number of digits', () => {
  eq(isHexColor('#ff'), false);
  eq(isHexColor('#12345'), false);
  eq(isHexColor('abc123'), false);
});

test('isHexColor rejects non-hex letters', () => {
  eq(isHexColor('#xyzxyz'), false);
});

test('isIdentifier accepts letters, digits and underscores', () => {
  eq(isIdentifier('user_name2'), true);
  eq(isIdentifier('_private'), true);
  eq(isIdentifier('x'), true);
});

test('isIdentifier rejects a leading digit', () => {
  eq(isIdentifier('2fast'), false);
});

test('isIdentifier rejects hyphens, spaces and emptiness', () => {
  eq(isIdentifier('user-name'), false);
  eq(isIdentifier('user name'), false);
  eq(isIdentifier(''), false);
});
