// ─────────────────────────────────────────────────────────────────────────
//  28 · sign a message with HMAC — SOLUTION                     ★★☆ core
//  run: node 28-hmac-sign.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: createHmac('sha256', secret) is createHash plus a key —
//  same update/digest shape, so signMessage is a one-liner. The secret
//  goes in the constructor, never into the message; `sha256(secret + msg)`
//  is the classic wrong turn and it is forgeable (look up length-extension
//  attacks) which is precisely why HMAC exists.
//  Verification re-signs and compares. Convert both sides back to BYTES
//  with Buffer.from(hex, 'hex') and let timingSafeEqual do the compare:
//  `===` on strings bails out at the first wrong character, and the time
//  that saves is a measurable hint an attacker can climb one character at
//  a time.
//  The length guard has to run first — timingSafeEqual throws on a length
//  mismatch. Buffer.from stops at the first non-hex character, so junk
//  decodes short and falls out of the same guard as false.

import { test, eq, ok } from '../../_lib/check.js';
import { createHmac, timingSafeEqual } from 'node:crypto';

export function signMessage(secret, message) {
  return createHmac('sha256', secret).update(message, 'utf8').digest('hex');
}

export function verifyMessage(secret, message, signature) {
  const expected = Buffer.from(signMessage(secret, message), 'hex');
  const given = Buffer.from(String(signature ?? ''), 'hex');
  if (given.length !== expected.length) return false;
  return timingSafeEqual(expected, given);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('matches the published HMAC-SHA256 test vector', () => {
  eq(
    signMessage('key', 'The quick brown fox jumps over the lazy dog'),
    'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'
  );
});

test('a signature is 64 lowercase hex characters', () => {
  const sig = signMessage('s3cret', 'ship it');
  eq(sig.length, 64);
  ok(/^[0-9a-f]{64}$/.test(sig));
});

test('the same secret and message always sign the same', () => {
  eq(signMessage('k', 'payload'), signMessage('k', 'payload'));
});

test('a different secret signs differently', () => {
  ok(signMessage('k1', 'payload') !== signMessage('k2', 'payload'));
});

test('one changed character changes the signature', () => {
  ok(signMessage('k', 'amount=10') !== signMessage('k', 'amount=11'));
});

test('verifyMessage accepts a genuine signature', () => {
  const sig = signMessage('k', 'amount=10');
  eq(verifyMessage('k', 'amount=10', sig), true);
});

test('verifyMessage rejects a tampered message or the wrong secret', () => {
  const sig = signMessage('k', 'amount=10');
  eq(verifyMessage('k', 'amount=1000', sig), false);
  eq(verifyMessage('not-k', 'amount=10', sig), false);
});

test('a malformed signature is false, not an exception', () => {
  eq(verifyMessage('k', 'msg', 'deadbeef'), false);
  eq(verifyMessage('k', 'msg', ''), false);
  eq(verifyMessage('k', 'msg', 'z'.repeat(64)), false);
});
