// ─────────────────────────────────────────────────────────────────────────
//  05 · password-reset tokens you can guess — SOLUTION       ★★☆ core
//  concepts: security · CSPRNG · unguessable tokens
//  run: node 05-predictable-token.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: a predictable secret. The token was a counter in hex —
//  `reset-3e9`, `reset-3ea`, … — so seeing one reset token told an
//  attacker every other account's token. Unique is not the same as
//  unpredictable; an auto-increment id is perfectly unique and perfectly
//  guessable.
//  The tell: a security token built from a counter, a timestamp, or
//  `Math.random()`. None of those are cryptographically random —
//  Math.random in particular is seeded PRNG state an attacker can
//  recover from a few outputs.
//  The minimal fix: draw from a CSPRNG —
//      import { randomBytes } from 'node:crypto';
//      export function makeResetToken() {
//        return randomBytes(16).toString('hex'); // 128 bits, 32 hex chars
//      }
//  16 bytes = 128 bits of entropy: unique in practice AND unguessable.
//  In the wild: session ids, API keys, reset/verify links, CSRF tokens,
//  filenames meant to be unlisted. Anything a bearer of the value gets
//  to DO something with needs crypto randomness, never Math.random.

import { test, ok } from '../../_lib/check.js';
import { randomBytes } from 'node:crypto';

export function makeResetToken() {
  return randomBytes(16).toString('hex');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a token is a long hex string', () => {
  const tok = makeResetToken();
  ok(/^[0-9a-f]{32,}$/.test(tok), `expected 32+ hex chars, got ${tok}`);
});

test('1000 tokens are all distinct', () => {
  const seen = new Set();
  for (let i = 0; i < 1000; i++) seen.add(makeResetToken());
  ok(seen.size === 1000, 'every token must be unique');
});

test('consecutive tokens are not adjacent values', () => {
  // if token N+1 is predictable from token N, this catches it
  const a = BigInt('0x' + makeResetToken());
  const b = BigInt('0x' + makeResetToken());
  const gap = a > b ? a - b : b - a;
  ok(gap > 1n << 64n, 'consecutive tokens must be astronomically far apart');
});

test('tokens carry real entropy (many distinct leading bytes)', () => {
  const firstBytes = new Set();
  for (let i = 0; i < 200; i++) firstBytes.add(makeResetToken().slice(0, 2));
  ok(firstBytes.size > 50, `expected varied prefixes, saw ${firstBytes.size}`);
});
