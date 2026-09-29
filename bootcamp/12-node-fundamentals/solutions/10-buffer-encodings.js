// ─────────────────────────────────────────────────────────────────────────
//  10 · buffer encodings — SOLUTION                        ★☆☆ warm-up
//  run: node 10-buffer-encodings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every one of these is "Buffer.from(input, encodingIn)
//  .toString(encodingOut)". Naming the input encoding matters: Buffer
//  .from defaults to 'utf8', so `Buffer.from(base64String)` silently
//  stores the base64 TEXT instead of decoding it — the bug looks like
//  data corruption but is really a missing second argument.
//  Note that base64 and hex are byte-level, so multi-byte characters
//  survive automatically: 'café' is five bytes and comes back as four
//  characters because utf8 does the reassembly on the way out.

import { test, eq } from '../../_lib/check.js';

export function toBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

export function fromBase64(base64) {
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function toHex(text) {
  return Buffer.from(text, 'utf8').toString('hex');
}

export function fromHex(hex) {
  return Buffer.from(hex, 'hex').toString('utf8');
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
