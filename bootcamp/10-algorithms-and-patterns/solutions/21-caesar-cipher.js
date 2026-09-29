// ─────────────────────────────────────────────────────────────────────────
//  21 · caesar / rot13 — SOLUTION                           ★☆☆ warm-up
//  concepts: pattern: character-code arithmetic · modular wrap-around
//  run: node 21-caesar-cipher.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: map a character to a 0-25 index, do arithmetic
//  mod 26, map it back. Subtract the base code ('a' = 97, 'A' = 65), add
//  the shift, take `% 26`, add the base back.
//  Normalise the shift ONCE up front with `((shift % 26) + 26) % 26`:
//  JS's `%` keeps the sign of the left operand, so -1 % 26 is -1, and
//  `String.fromCharCode(96)` is a backtick, not 'z'. That double-mod is
//  the idiom for "always non-negative remainder" and it is worth
//  memorising — it shows up in rotation, ring buffers and hashing.
//  Time O(n), space O(n). The naive version keeps an 'abcdefg...' string
//  and calls indexOf per character: O(26·n) and it needs a second string
//  for uppercase. Character codes are the cleaner tool.
//  rot13 is literally caesar(text, 13); 13 + 13 = 26 = identity, which is
//  why applying it twice returns the original.

import { test, eq } from '../../_lib/check.js';

export function caesar(text, shift) {
  const offset = ((shift % 26) + 26) % 26;
  const shiftFrom = (code, base) =>
    String.fromCharCode(((code - base + offset) % 26) + base);
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 97 && code <= 122) out += shiftFrom(code, 97);
    else if (code >= 65 && code <= 90) out += shiftFrom(code, 65);
    else out += ch;
  }
  return out;
}

export function rot13(text) {
  return caesar(text, 13);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('shifts lowercase letters forward', () => {
  eq(caesar('abc', 1), 'bcd');
});

test('wraps around the end of the alphabet', () => {
  eq(caesar('xyz', 3), 'abc');
});

test('preserves case and leaves punctuation alone', () => {
  eq(caesar('Hello, World!', 1), 'Ifmmp, Xpsme!');
  eq(caesar('a1!', 1), 'b1!');
});

test('a negative shift decodes', () => {
  eq(caesar('bcd', -1), 'abc');
  eq(caesar(caesar('Attack at dawn', 5), -5), 'Attack at dawn');
});

test('a shift bigger than 26 wraps', () => {
  eq(caesar('a', 27), 'b');
  eq(caesar('a', 0), 'a');
});

test('handles empty text', () => {
  eq(caesar('', 5), '');
});

test('rot13 shifts by thirteen', () => {
  eq(rot13('Hello'), 'Uryyb');
});

test('rot13 is its own inverse', () => {
  eq(rot13(rot13('Hello, World!')), 'Hello, World!');
});
