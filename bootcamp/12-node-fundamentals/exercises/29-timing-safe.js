// ─────────────────────────────────────────────────────────────────────────
//  29 · constant-time comparison                             ★☆☆ warm-up
//  concepts: timingSafeEqual · bytes vs strings · leaking by timing
//  run: node 29-timing-safe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `token === expected` stops at the first character that differs. That
//  tiny time difference is a real side channel: an attacker who can time
//  your endpoint learns the secret one character at a time. Comparing
//  secrets is the one place `===` is the wrong tool.
//
//      constantTimeEquals('abc', 'abc')   → true
//      constantTimeEquals('abc', 'abd')   → false
//      constantTimeEquals('abc', 'ab')    → false   (must NOT throw)
//      constantTimeEquals(Buffer.from('hi'), 'hi')  → true
//
//  Accept strings (compared as UTF-8 bytes) or Buffers. crypto's
//  timingSafeEqual does the real work, but it throws when the two buffers
//  have different byte lengths — so your wrapper answers that case itself.
//  Leaking the LENGTH is fine; a token's length is not the secret.

import { test, eq, throws } from '../../_lib/check.js';
import { createHash, timingSafeEqual } from 'node:crypto';

export function constantTimeEquals(a, b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('identical strings compare equal', () => {
  eq(constantTimeEquals('s3cret-token', 's3cret-token'), true);
});

test('same length, different content is false', () => {
  eq(constantTimeEquals('abc', 'abd'), false);
  eq(constantTimeEquals('abc', 'zbc'), false);
});

test('different lengths answer false instead of throwing', () => {
  eq(constantTimeEquals('abc', 'ab'), false);
  eq(constantTimeEquals('', 'a'), false);
  // this is what the wrapper is protecting you from:
  throws(() => timingSafeEqual(Buffer.from('abc'), Buffer.from('ab')));
});

test('two empty inputs are equal', () => {
  eq(constantTimeEquals('', ''), true);
});

test('it compares bytes, so a Buffer equals its own text', () => {
  eq(constantTimeEquals(Buffer.from('hi', 'utf8'), 'hi'), true);
  eq(constantTimeEquals('é', 'e'), false);
});

test('it is drop-in for comparing digests', () => {
  const digest = (s) => createHash('sha256').update(s).digest('hex');
  eq(constantTimeEquals(digest('same'), digest('same')), true);
  eq(constantTimeEquals(digest('one'), digest('two')), false);
});
