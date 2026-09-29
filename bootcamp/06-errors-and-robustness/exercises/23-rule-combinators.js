// ─────────────────────────────────────────────────────────────────────────
//  23 · validation rules you can compose                       ★★☆ core
//  concepts: combinators · rule lists · all-errors mode
//  run: node 23-rule-combinators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 09 hand-wrote one validator for one shape. That does not
//  scale: the next form re-writes the same "is it blank" branch, and
//  the two drift. Build the pieces instead — small rules, composed per
//  field, reported all at once.
//
//  A rule is a function: value → null when happy, a message when not.
//  A combinator is a function that BUILDS a rule.
//
//    required()             → 'is required'
//    minLen(n)              → `must be at least ${n} characters`
//    matches(re, message)   → your message, when the value does not match
//    checkAll(input, schema) → { field: [messages] }, broken fields only
//
//      const schema = { password: [required(), minLen(8)] };
//      checkAll({ password: 'abc' }, schema)
//          → { password: ['must be at least 8 characters'] }
//      checkAll({ password: 'correcthorse' }, schema)   → {}
//
//  minLen measures the TRIMMED length: '  short  ' is 5, not 9.
//
//  Every rule EXCEPT required() passes an empty value — absence is
//  required()'s one job, so a blank field reports 'is required' once
//  instead of every rule complaining at the same time. Everything else
//  is all-errors: a field reports every rule it broke, in rule order.
//
//  hint: `isEmpty` below is given. Each rule is a one-liner over it.

import { test, eq } from '../../_lib/check.js';

// ── given: one shared idea of "empty" ────────────────────────────────────

const isEmpty = (value) =>
  value === undefined || value === null || String(value).trim() === '';

// ── your work ────────────────────────────────────────────────────────────

export function required() {
  throw new Error('TODO');
}

export function minLen(n) {
  throw new Error('TODO');
}

export function matches(pattern, message) {
  throw new Error('TODO');
}

export function checkAll(input, schema) {
  throw new Error('TODO');
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
