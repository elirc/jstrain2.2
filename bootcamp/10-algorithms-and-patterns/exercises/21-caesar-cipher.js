// ─────────────────────────────────────────────────────────────────────────
//  21 · caesar / rot13                                      ★☆☆ warm-up
//  concepts: pattern: character-code arithmetic · modular wrap-around
//  run: node 21-caesar-cipher.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Shift every letter `shift` places along the alphabet, wrapping z back
//  to a. Case is preserved; anything that is not a letter is left alone.
//  rot13 is just caesar with a shift of 13 — apply it twice and you are
//  back where you started.
//
//      caesar('abc', 1)             → 'bcd'
//      caesar('xyz', 3)             → 'abc'
//      caesar('Hello, World!', 1)   → 'Ifmmp, Xpsme!'
//      caesar('bcd', -1)            → 'abc'
//      rot13('Hello')               → 'Uryyb'
//
//  Negative shifts and shifts bigger than 26 must work.

import { test, eq } from '../../_lib/check.js';

export function caesar(text, shift) {
  throw new Error('TODO');
}

export function rot13(text) {
  throw new Error('TODO');
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
