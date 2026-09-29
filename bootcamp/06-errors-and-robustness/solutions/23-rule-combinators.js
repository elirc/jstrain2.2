// ─────────────────────────────────────────────────────────────────────────
//  23 · validation rules you can compose — SOLUTION            ★★☆ core
//  run: node 23-rule-combinators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every rule has the same signature — value → null or a
//  message — and that single shape is what makes them composable. A
//  combinator like minLen(8) is just a closure over its configuration
//  that returns one of those functions; the schema is then plain data,
//  and checkAll never needs to know what any individual rule does.
//  The division of labour matters more than the code. If minLen also
//  policed absence, a blank password would report three messages that
//  all mean "you left it empty". One rule owns presence; the others
//  return null and stay out of the way.
//  checkAll is fail-slow on purpose: `.map(...).filter(...)` runs every
//  rule and keeps every message, in rule order, because a form should
//  report all its problems in one round trip (exercise 09's lesson,
//  now reusable).
//  Watch out for a /g regex in matches — `.test` on a global regex is
//  stateful and alternates true/false across calls. Keep rule patterns
//  un-flagged.

import { test, eq } from '../../_lib/check.js';

// ── given: one shared idea of "empty" ────────────────────────────────────

const isEmpty = (value) =>
  value === undefined || value === null || String(value).trim() === '';

// ── your work ────────────────────────────────────────────────────────────

export function required() {
  return (value) => (isEmpty(value) ? 'is required' : null);
}

export function minLen(n) {
  return (value) => {
    if (isEmpty(value)) return null;
    return String(value).trim().length < n
      ? `must be at least ${n} characters`
      : null;
  };
}

export function matches(pattern, message) {
  return (value) => {
    if (isEmpty(value)) return null;
    return pattern.test(String(value)) ? null : message;
  };
}

export function checkAll(input, schema) {
  const problems = {};
  for (const [field, rules] of Object.entries(schema)) {
    const messages = rules
      .map((rule) => rule(input[field]))
      .filter((message) => message !== null);
    if (messages.length > 0) problems[field] = messages;
  }
  return problems;
}

// ── given: a schema, built lazily so the file loads before you start ─────

const makeSignupSchema = () => ({
  name: [required()],
  password: [required(), minLen(8), matches(/\d/, 'must contain a digit')],
});

// ──────────────────────────── tests ──────────────────────────────────────

test('required() rejects undefined, null and blank text', () => {
  const rule = required();
  eq(rule(undefined), 'is required');
  eq(rule(null), 'is required');
  eq(rule('   '), 'is required');
  eq(rule('Ada'), null);
});

test('minLen counts trimmed characters', () => {
  const rule = minLen(8);
  eq(rule('  short  '), 'must be at least 8 characters');
  eq(rule('correcthorse'), null);
});

test('minLen and matches pass an empty value — only required() cares', () => {
  eq(minLen(8)(''), null);
  eq(minLen(8)(undefined), null);
  eq(matches(/\d/, 'must contain a digit')(null), null);
});

test('matches returns the message you gave it', () => {
  const rule = matches(/@/, 'must contain @');
  eq(rule('nope'), 'must contain @');
  eq(rule('ada@lovelace.dev'), null);
});

test('checkAll collects every broken rule for a field, in rule order', () => {
  eq(checkAll({ name: 'Ada', password: 'abc' }, makeSignupSchema()), {
    password: ['must be at least 8 characters', 'must contain a digit'],
  });
});

test('a field that passes is not mentioned, and clean input gives {}', () => {
  const input = { name: 'Ada', password: 'correcthorse9' };
  eq(checkAll(input, makeSignupSchema()), {});
});

test('a missing field reports being required, and nothing else', () => {
  eq(checkAll({}, makeSignupSchema()), {
    name: ['is required'],
    password: ['is required'],
  });
});
