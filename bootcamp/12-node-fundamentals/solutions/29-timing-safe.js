// ─────────────────────────────────────────────────────────────────────────
//  29 · constant-time comparison — SOLUTION                  ★☆☆ warm-up
//  run: node 29-timing-safe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: normalise to Buffers first — timingSafeEqual only speaks
//  bytes, and going through Buffer is what makes 'é' (two bytes) and 'e'
//  (one byte) obviously different instead of accidentally comparable.
//  The length guard is not a cheat: timingSafeEqual throws on unequal
//  lengths, and answering false early only reveals the length, which is
//  public. What must stay constant-time is the comparison of two secrets
//  of the SAME length, and that is exactly the part you delegate.
//  The classic wrong turn is `a === b` on hex digests. It is correct and
//  it is fast, and its speed is the leak.

import { test, eq, throws } from '../../_lib/check.js';
import { createHash, timingSafeEqual } from 'node:crypto';

export function constantTimeEquals(a, b) {
  const left = Buffer.isBuffer(a) ? a : Buffer.from(String(a), 'utf8');
  const right = Buffer.isBuffer(b) ? b : Buffer.from(String(b), 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
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
