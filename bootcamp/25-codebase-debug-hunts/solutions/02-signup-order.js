// ─────────────────────────────────────────────────────────────────────────
//  02 · three correct files, one wrong pipeline — SOLUTION   ★★★ stretch
//  concepts: bug hunt · pipeline order · normalize before validate
//  run: node 02-signup-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: pipeline order. Not one function here was wrong —
//  normalize normalizes, validate validates exactly what it documents
//  (NORMALIZED input; it rejects whitespace and uppercase because
//  repairing them is normalize's job). users.js just called them in the
//  wrong order: it validated the RAW string, so every padded or
//  capitalized paste was declared garbage before normalize ever got to
//  clean it.
//  The tell: validate.js's first comment line says "expects input that
//  already went through normalizeEmail", and users.js hands it rawEmail.
//  In a multi-file hunt, when every unit is defensible, diff each call
//  site against the callee's documented precondition — the composing
//  file owns the order, so the composing file owns the bug.
//  The minimal fix, in users.js: swap the two steps —
//      const email = normalizeEmail(rawEmail);
//      if (!isValidEmail(email)) throw …
//  Weakening validate.js to "repair" raw input instead would pass the
//  tests and quietly fork the definition of canonical across two files —
//  the next comparison written against the store would inherit the mess.
//  In the wild: parse-then-validate vs validate-then-parse, sanitizing
//  after the length check, hashing before trimming — every "works when
//  typed carefully" auth bug.

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
