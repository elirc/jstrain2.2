// ─────────────────────────────────────────────────────────────────────────
//  05 · password-reset tokens you can guess                  ★★☆ core
//  concepts: security · CSPRNG · unguessable tokens
//  run: node 05-predictable-token.js
// ─────────────────────────────────────────────────────────────────────────
//
//  makeResetToken() mints the secret in a password-reset link. Whoever
//  holds the token can reset the account, so it must be UNGUESSABLE: no
//  two ever equal, and knowing one tells you nothing about the next.
//  Shape: a long hex string.
//
//      makeResetToken()  → 'a3f9…' (32 hex chars, unpredictable)
//
//  An attacker requested one reset for their own account, saw the
//  token's pattern, and walked it to other users' tokens.
//
//  The code below is fully written — and a security hole. 3 tests fail:
//  they check the tokens are long and unpredictable. Find the flaw and
//  fix it with the smallest change. Keep makeResetToken()'s signature.
//
//  hint: "random enough to look shuffled" and "random enough that an
//  attacker cannot predict it" are different bars. What does this
//  generator use as its source of surprise, and could you reproduce its
//  output if you knew the starting state?

import { test, ok } from '../../_lib/check.js';

let counter = 1000;

export function makeResetToken() {
  counter += 1;
  return `reset-${counter.toString(16)}`;
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
