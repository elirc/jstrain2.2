// ─────────────────────────────────────────────────────────────────────────
//  02 · three correct files, one wrong pipeline               ★★★ stretch
//  concepts: bug hunt · pipeline order · normalize before validate
//  run: node 02-signup-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The signup slice of a users service, three files, in
//  ./02-signup-order-app/:
//
//      normalize.js   canonical form (trim + lowercase)
//      validate.js    shape checks for a NORMALIZED address
//      users.js       the flow: signUp(store, rawEmail)
//
//  The spec: people type their address any way they like —
//  '  Ada@Example.com  ' signs up as 'ada@example.com', and ANY spelling
//  of an existing address is rejected as 'already registered'. Garbage
//  is rejected as 'invalid email'.
//
//  Support tickets say real customers pasting their address from mail
//  apps (padded, capitalized) are told their own email is invalid.
//
//  Read each file's top comment, then its body: every function does
//  exactly what its file promises. 2 tests fail anyway. The bug is in
//  HOW the pieces are composed — fix it with the smallest change, in the
//  file that composes them. Don't rewrite, don't weaken validate.js.
//
//  hint: follow '  Ada@Example.com  ' through users.js line by line and
//  write down what each helper was PROMISED as input versus what it was
//  HANDED. One of them is being fed something it documented away.

import { test, eq, throws } from '../../_lib/check.js';
import { signUp } from './02-signup-order-app/users.js';

// ──────────────────────────── tests ──────────────────────────────────────

test('a plain lowercase signup is stored canonically', () => {
  const store = new Set();
  eq(signUp(store, 'ada@example.com'), 'ada@example.com');
  eq([...store], ['ada@example.com']);
});

test('the exact same address twice is already registered', () => {
  const store = new Set();
  signUp(store, 'ada@example.com');
  throws(() => signUp(store, 'ada@example.com'), 'already registered');
});

test('padded, capitalized input signs up in canonical form', () => {
  const store = new Set();
  eq(signUp(store, '  Ada@Example.com  '), 'ada@example.com');
  eq([...store], ['ada@example.com']);
});

test('a duplicate in ANY spelling is already registered, not invalid', () => {
  const store = new Set();
  signUp(store, 'ada@example.com');
  throws(() => signUp(store, 'ADA@example.com'), 'already registered');
});

test('actual garbage is still rejected as invalid', () => {
  const store = new Set();
  throws(() => signUp(store, 'not-an-email'), 'invalid email');
  eq(store.size, 0);
});
