// ─────────────────────────────────────────────────────────────────────────
//  05 · validate at the boundary — SOLUTION                  ★★★ stretch
//  concepts: input validation · parse-don't-validate · Result
//  run: node 05-validate-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  One pass that collects every problem AND builds the clean value as it
//  goes. Each field is checked independently and pushes a 'field: reason'
//  string on failure, so the caller sees all errors at once (a form that
//  reveals one error per submit is a validator that quit early). On
//  success the returned value is already normalized — trimmed name,
//  lowercased email — so downstream code never re-cleans it.
//  This is "parse, don't validate": the function's output is a NARROWER
//  thing than its input (a known shape), not a yes/no about the input.
//  After the boundary, the rest of the app holds a value it can trust; a
//  boolean would force every later reader to re-check.
//  Optional age is the subtle case: ABSENT is valid and omitted from the
//  result, but PRESENT-and-wrong is an error. Conflating "missing" with
//  "invalid" is the classic slip — guard on `'age' in raw` (or
//  undefined) before range-checking.
//  In real code this is where a schema library (zod, valibot) earns its
//  keep — same idea, one source of truth for the type and the check. The
//  hand-rolled version here is to show what they do, not to replace them.

import { test, eq } from '../../_lib/check.js';

export function parseSignup(raw) {
  const errors = [];
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['body: must be an object'] };
  }

  const value = {};

  if (typeof raw.name !== 'string' || raw.name.trim() === '') {
    errors.push('name: required');
  } else {
    value.name = raw.name.trim();
  }

  if (typeof raw.email !== 'string' || !raw.email.includes('@')) {
    errors.push('email: must contain @');
  } else {
    value.email = raw.email.trim().toLowerCase();
  }

  if (raw.age !== undefined) {
    if (!Number.isInteger(raw.age) || raw.age < 13 || raw.age > 120) {
      errors.push('age: must be an integer 13–120');
    } else {
      value.age = raw.age;
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, value };
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
  eq(out.errors.length, 3);
});

test('a non-object input fails cleanly', () => {
  const out = parseSignup(null);
  eq(out.ok, false);
  eq(out.errors.length > 0, true);
});
