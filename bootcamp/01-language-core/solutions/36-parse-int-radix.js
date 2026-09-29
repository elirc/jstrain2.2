// ─────────────────────────────────────────────────────────────────────────
//  36 · parseInt and radix — SOLUTION                       ★☆☆ warm-up
//  run: node 36-parse-int-radix.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: parseInt is a scanner, not a validator — it consumes legal
//  digits until it meets one it does not like and returns what it has. The
//  fix is to validate first: slice the alphabet down to `radix` characters
//  and demand that every character in the input appears in it. Only then
//  is parseInt safe to call, because by construction it cannot stop early.
//
//  '0x1f' in base 16 is the instructive failure: 'x' is not a hex digit,
//  so the strict answer is null even though parseInt('0x1f') happily
//  returns 31 by sniffing the prefix and picking base 16 for you.
//
//  The sign is re-applied only for non-zero values, because `-0` is a
//  value deep equality can see (README gotcha 4).
//
//  `list.map(parseInt)` is the famous one: map passes (value, index), so
//  the index lands in the radix slot — base 0, then 1, then 2. Always
//  wrap: `list.map((t) => parseInt(t, 10))`.

import { test, eq } from '../../_lib/check.js';

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

export function parseIn(text, radix = 10) {
  if (typeof text !== 'string') return null;
  if (!Number.isInteger(radix) || radix < 2 || radix > 36) return null;
  const body = text.trim().toLowerCase();
  const negative = body.startsWith('-');
  const digits = negative ? body.slice(1) : body;
  if (digits === '') return null;
  const allowed = DIGITS.slice(0, radix);
  for (const character of digits) {
    if (!allowed.includes(character)) return null;
  }
  const value = parseInt(digits, radix);
  return negative && value !== 0 ? -value : value;
}

export function parseAll(list) {
  return list.map((text) => parseIn(text, 10));
}

export function hexToBytes(text) {
  if (typeof text !== 'string' || text.length % 2 !== 0) return null;
  const bytes = [];
  for (let i = 0; i < text.length; i += 2) {
    const byte = parseIn(text.slice(i, i + 2), 16);
    if (byte === null) return null;
    bytes.push(byte);
  }
  return bytes;
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
