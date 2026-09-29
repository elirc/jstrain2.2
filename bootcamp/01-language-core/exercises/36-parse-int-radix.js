// ─────────────────────────────────────────────────────────────────────────
//  36 · parseInt and radix                                  ★☆☆ warm-up
//  concepts: parseInt radix · partial parses · map(parseInt)
//  run: node 36-parse-int-radix.js
// ─────────────────────────────────────────────────────────────────────────
//
//  parseInt takes a SECOND argument — the base — and stops reading at the
//  first character that is not a digit in that base, returning whatever it
//  had. Write the strict version: every character must be legal, or null.
//
//      parseIn('42')        → 42      parseIn('ff')       → null
//      parseIn('ff', 16)    → 255     parseIn('0x1f', 16) → null ('x'!)
//      parseIn('1010', 2)   → 10      parseIn('2', 2)     → null
//      parseIn('-1010', 2)  → -10     parseIn('42px')     → null
//      parseIn('z', 36)     → 35      parseIn('42', 1)    → null
//
//  The base defaults to 10 and must be an integer from 2 to 36; anything
//  else is null, and so is a non-string input. Digits are case-insensitive
//  and surrounding whitespace is fine.
//
//      parseAll(['1', '7', '11'])   → [1, 7, 11]
//      hexToBytes('4a2f')           → [74, 47]
//      hexToBytes('abc')            → null      (odd length)

import { test, eq } from '../../_lib/check.js';

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

export function parseIn(text, radix = 10) {
  throw new Error('TODO');
}

export function parseAll(list) {
  throw new Error('TODO');
}

export function hexToBytes(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('base 10 is the default, and other bases are opt-in', () => {
  eq(parseIn('42'), 42);
  eq(parseIn('42', 10), 42);
  eq(parseIn('ff', 16), 255);
  eq(parseIn('FF', 16), 255);
  eq(parseIn('1010', 2), 10);
  eq(parseIn('777', 8), 511);
  eq(parseIn('z', 36), 35);
});

test('every character has to be a legal digit for that base', () => {
  eq(parseIn('ff'), null);
  eq(parseIn('2', 2), null);
  eq(parseIn('8', 8), null);
  eq(parseIn('0x1f', 16), null);
});

test('this is exactly the leniency parseInt gives you for free', () => {
  eq(parseIn('42px'), null);
  eq(parseIn('1e3'), null);
  eq(parseInt('42px'), 42);
  eq(parseInt('1e3'), 1);
  eq(parseInt('0x1f'), 31); // a base you never asked for
});

test('the same digits mean different numbers in different bases', () => {
  eq(parseIn('101', 2), 5);
  eq(parseIn('101', 10), 101);
  eq(parseIn('101', 16), 257);
});

test('whitespace, signs and empty input', () => {
  eq(parseIn('  42  '), 42);
  eq(parseIn('-42'), -42);
  eq(parseIn('-1010', 2), -10);
  eq(parseIn(''), null);
  eq(parseIn('   '), null);
  eq(parseIn('-'), null);
  eq(parseIn(42), null);
});

test('a base outside 2..36 is refused instead of guessed', () => {
  eq(parseIn('42', 1), null);
  eq(parseIn('42', 37), null);
  eq(parseIn('42', 2.5), null);
});

test('parseAll reads base 10 — and why map(parseInt) cannot', () => {
  eq(parseAll(['1', '7', '11']), [1, 7, 11]);
  eq(parseAll(['08', '09']), [8, 9]);
  eq(parseAll(['x']), [null]);
  eq(['1', '7', '11'].map(parseInt), [1, NaN, 3]); // index becomes the radix
});

test('hexToBytes turns a hex string into byte values', () => {
  eq(hexToBytes('4a2f'), [74, 47]);
  eq(hexToBytes('00ff'), [0, 255]);
  eq(hexToBytes(''), []);
  eq(hexToBytes('abc'), null);
  eq(hexToBytes('zz'), null);
  eq(hexToBytes(42), null);
});
