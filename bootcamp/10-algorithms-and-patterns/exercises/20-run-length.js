// ─────────────────────────────────────────────────────────────────────────
//  20 · encode / decode                                     ★★☆ core
//  concepts: pattern: run detection (group consecutive) · round-tripping
//  run: node 20-run-length.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Run-length encoding: replace each run of repeated characters with the
//  character followed by its count. Always write the count, even 1.
//
//      encode('aaabbc')       → 'a3b2c1'
//      encode('abc')          → 'a1b1c1'
//      encode('zzzzzzzzzzzz') → 'z12'      (counts can be multi-digit!)
//      decode('a3b2c1')       → 'aaabbc'
//      decode('')             → ''
//
//  decode is the exact inverse: decode(encode(text)) === text for any
//  text made of letters. Input to encode contains no digits.
//
//  hint: for decode, read a character then keep reading while the next
//  characters are digits — do not assume the count is one character

import { test, eq } from '../../_lib/check.js';

export function encode(text) {
  throw new Error('TODO');
}

export function decode(code) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('encode collapses runs of repeats', () => {
  eq(encode('aaabbc'), 'a3b2c1');
});

test('encode writes a count of 1 for lone characters', () => {
  eq(encode('abc'), 'a1b1c1');
});

test('encode handles a run longer than nine', () => {
  eq(encode('zzzzzzzzzzzz'), 'z12');
});

test('encode handles empty text and one character', () => {
  eq(encode(''), '');
  eq(encode('q'), 'q1');
});

test('decode expands counts back into runs', () => {
  eq(decode('a3b2c1'), 'aaabbc');
});

test('decode reads multi-digit counts', () => {
  eq(decode('z12'), 'z'.repeat(12));
  eq(decode('a10b2'), 'aaaaaaaaaabb');
});

test('decode handles empty input', () => {
  eq(decode(''), '');
});

test('encode and decode round-trip', () => {
  const text = 'mississippi';
  eq(encode(text), 'm1i1s2i1s2i1p2i1');
  eq(decode(encode(text)), text);
});
