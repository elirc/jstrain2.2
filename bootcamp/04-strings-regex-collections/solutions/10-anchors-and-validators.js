// ─────────────────────────────────────────────────────────────────────────
//  10 · anchors and validators — SOLUTION                       ★★☆ core
//  run: node 10-anchors-and-validators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both patterns are the same shape — ^ … $ around the whole
//  thing. Drop either anchor and 'say #fff please' passes, because test()
//  only asks whether the pattern appears SOMEWHERE.
//  isHexColor: '#' then the alternation ({6}|{3}). Order matters inside
//  the alternation only if you leave the anchors off; with $ in place,
//  the 3-digit branch cannot swallow the first half of a 6-digit colour.
//  The i flag covers '#FFF' without doubling the class to [0-9a-fA-F].
//  isIdentifier: one starter character [A-Za-z_], then * (zero or more)
//  of the wider class — * not +, so a one-character name like 'x' is
//  valid, while '' still fails because the starter is required.

import { test, eq } from '../../_lib/check.js';

export function isHexColor(text) {
  return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(text);
}

export function isIdentifier(text) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text);
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
