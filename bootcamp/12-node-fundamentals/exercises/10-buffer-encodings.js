// ─────────────────────────────────────────────────────────────────────────
//  10 · buffer encodings                                   ★☆☆ warm-up
//  concepts: Buffer · base64 · hex · utf8
//  run: node 10-buffer-encodings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Buffer is a fixed chunk of raw bytes. Text becomes bytes with an
//  encoding on the way in, and bytes become text with an encoding on the
//  way out — Buffer is the place both conversions happen.
//
//      Buffer.from(text, 'utf8')        text  → bytes
//      buffer.toString('base64')        bytes → text
//
//      toBase64('hello')     → 'aGVsbG8='
//      fromBase64('aGVsbG8=')→ 'hello'
//      toHex('hi')           → '6869'
//      fromHex('6869')       → 'hi'
//
//  base64 and hex are transport formats, not encryption — anyone can
//  reverse them, which is the whole point.

import { test, eq } from '../../_lib/check.js';

export function toBase64(text) {
  throw new Error('TODO');
}

export function fromBase64(base64) {
  throw new Error('TODO');
}

export function toHex(text) {
  throw new Error('TODO');
}

export function fromHex(hex) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('encodes a known string to base64', () => {
  eq(toBase64('hello'), 'aGVsbG8=');
});

test('round trips through base64', () => {
  const text = 'The quick brown fox.';
  eq(fromBase64(toBase64(text)), text);
});

test('encodes a known string to hex', () => {
  eq(toHex('hi'), '6869');
});

test('round trips through hex', () => {
  eq(fromHex(toHex('node')), 'node');
});

test('non-ASCII survives base64', () => {
  eq(toBase64('café'), 'Y2Fmw6k=');
  eq(fromBase64('Y2Fmw6k='), 'café');
});

test('an emoji survives a hex round trip', () => {
  eq(toHex('👋'), 'f09f918b');
  eq(fromHex('f09f918b'), '👋');
});

test('the empty string encodes to the empty string', () => {
  eq(toBase64(''), '');
  eq(toHex(''), '');
  eq(fromBase64(''), '');
  eq(fromHex(''), '');
});
