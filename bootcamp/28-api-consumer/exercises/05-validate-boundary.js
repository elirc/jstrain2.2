// ─────────────────────────────────────────────────────────────────────────
//  05 · validate at the boundary                             ★★★ stretch
//  concepts: input validation · parse-don't-validate · Result
//  run: node 05-validate-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Untyped JSON from the network is the least trustworthy data in your
//  system. Validate it ONCE, at the edge, into a known shape — after
//  that, the rest of the app can trust it. This is "parse, don't
//  validate": return the clean object, not just a boolean.
//
//  Build parseSignup(raw) that takes any value and returns:
//    · { ok: true, value: { name, email, age } } when raw is valid
//    · { ok: false, errors: [ 'field: reason', ... ] } otherwise, with
//      ALL problems collected (not just the first)
//  Rules:
//    · name  — non-empty string after trimming; stored trimmed
//    · email — string containing '@'; stored lowercased + trimmed
//    · age   — integer, 13..120 inclusive; missing age is OK → omit it
//      (optional field), but a PRESENT invalid age is an error
//
//      parseSignup({ name: ' Ada ', email: 'A@X.com', age: 30 })
//        → { ok: true, value: { name: 'Ada', email: 'a@x.com', age: 30 } }
//      parseSignup({ name: '', email: 'x' })
//        → { ok: false, errors: ['name: required', 'email: must contain @'] }
//
//  hint: collect errors into an array as you check each field; the
//  result is ok only if that array is empty. Coerce/normalize as you go
//  so the returned value is already clean.

import { test, eq } from '../../_lib/check.js';

export function parseSignup(raw) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a clean signup parses and is normalized', () => {
  eq(parseSignup({ name: ' Ada ', email: 'A@X.com', age: 30 }), {
    ok: true,
    value: { name: 'Ada', email: 'a@x.com', age: 30 },
  });
});

test('age is optional and omitted when absent', () => {
  eq(parseSignup({ name: 'Ada', email: 'a@x.com' }), {
    ok: true,
    value: { name: 'Ada', email: 'a@x.com' },
  });
});

test('all errors are collected, not just the first', () => {
  const out = parseSignup({ name: '  ', email: 'nope' });
  eq(out.ok, false);
  eq(out.errors.includes('name: required'), true);
  eq(out.errors.includes('email: must contain @'), true);
  eq(out.errors.length, 2);
});

test('a present but out-of-range age is rejected', () => {
  const out = parseSignup({ name: 'Ada', email: 'a@x.com', age: 5 });
  eq(out.ok, false);
  eq(out.errors.some((e) => e.startsWith('age')), true);
});

test('wrong types are rejected, not coerced into nonsense', () => {
  const out = parseSignup({ name: 42, email: null, age: '30' });
  eq(out.ok, false);
  // name not a string, email not a string, age not an integer
  eq(out.errors.length, 3);
});

test('a non-object input fails cleanly', () => {
  const out = parseSignup(null);
  eq(out.ok, false);
  eq(out.errors.length > 0, true);
});
