// ─────────────────────────────────────────────────────────────────────────
//  28 · sign a message with HMAC                                ★★☆ core
//  concepts: node:crypto · createHmac · verify by re-signing
//  run: node 28-hmac-sign.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A hash says "these bytes are these bytes". An HMAC says "these bytes
//  came from someone holding the secret" — it is what signs a webhook, a
//  session cookie and every JWT you have ever debugged.
//
//      signMessage('key', 'hello')            → 'f7bc83…'  (64 hex chars)
//      verifyMessage('key', 'hello', sig)     → true
//      verifyMessage('key', 'hell0', sig)     → false
//      verifyMessage('other', 'hello', sig)   → false
//
//  Verifying is not "decrypting" — you cannot unwind an HMAC. You re-sign
//  the message with the same secret and compare the two signatures. The
//  comparison must not leak how many characters matched, so compare the
//  raw bytes with crypto.timingSafeEqual, and return false (never throw)
//  when the caller hands you a signature of the wrong length or junk.
//
//  hint: timingSafeEqual throws unless both buffers are the same byte
//  length, so the length check has to come first — and it is fine for it
//  to be fast, because a signature's length is not a secret.

import { test, eq, ok } from '../../_lib/check.js';
import { createHmac, timingSafeEqual } from 'node:crypto';

export function signMessage(secret, message) {
  throw new Error('TODO');
}

export function verifyMessage(secret, message, signature) {
  throw new Error('TODO');
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
