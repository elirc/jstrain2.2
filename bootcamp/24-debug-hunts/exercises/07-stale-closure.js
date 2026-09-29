// ─────────────────────────────────────────────────────────────────────────
//  07 · makeValidators                                          ★★☆ core
//  concepts: closures · loop scope · capture by reference
//  run: node 07-stale-closure.js
// ─────────────────────────────────────────────────────────────────────────
//
//  makeValidators(rules) turns a list of { field, min } rules into a list
//  of little checkers. Each one is `{ field, order, check }`, and its
//  `check(form)` returns null when that field is long enough, or a
//  message when it is not:
//
//      '<field> needs at least <min> characters'
//
//  validate(form, validators) runs them all and collects the messages a
//  form earned, in rule order. A missing field counts as ''.
//
//  The code below is fully written — and wrong: 4 tests fail. Find the
//  planted bug and fix it with the smallest change that turns everything
//  green. It is one of the classic bug families; WHERE is the exercise.
//
//  hint: the list of validators is not where the surprise is. Pull ONE
//  out, call its check() by hand on a form holding only that one field,
//  and print what it actually looked at.

import { test, eq } from '../../_lib/check.js';

const RULES = [
  { field: 'username', min: 3 },
  { field: 'email', min: 6 },
  { field: 'password', min: 8 },
];

export function makeValidators(rules) {
  const validators = [];
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    validators.push({
      field: rule.field,
      order: i + 1,
      check: (form) => {
        const value = form[rule.field] ?? '';
        if (value.length >= rule.min) return null;
        return `${rule.field} needs at least ${rule.min} characters`;
      },
    });
  }
  return validators;
}

export function validate(form, validators) {
  return validators
    .map((validator) => validator.check(form))
    .filter((message) => message !== null);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one validator per rule, labelled and ordered', () => {
  const validators = makeValidators(RULES);
  eq(validators.map((v) => v.field), ['username', 'email', 'password']);
  eq(validators.map((v) => v.order), [1, 2, 3]);
});

test('a form that satisfies every rule reports nothing', () => {
  const form = { username: 'ada', email: 'a@b.io', password: 'hunter22!' };
  eq(validate(form, makeValidators(RULES)), []);
});

test('a short username is reported by name', () => {
  const form = { username: 'ad', email: 'a@b.io', password: 'hunter22!' };
  eq(validate(form, makeValidators(RULES)), [
    'username needs at least 3 characters',
  ]);
});

test('every broken rule gets its own message, in rule order', () => {
  const blank = { username: '', email: '', password: '' };
  eq(validate(blank, makeValidators(RULES)), [
    'username needs at least 3 characters',
    'email needs at least 6 characters',
    'password needs at least 8 characters',
  ]);
});

test('a missing field counts as empty and is still named', () => {
  const form = { username: 'ada', password: 'hunter22!' };
  eq(validate(form, makeValidators(RULES)), [
    'email needs at least 6 characters',
  ]);
});

test('a validator can be pulled out and called on its own', () => {
  const [, emailCheck] = makeValidators(RULES);
  eq(emailCheck.check({ email: 'x' }), 'email needs at least 6 characters');
  eq(emailCheck.check({ email: 'ada@b.io' }), null);
});

test('a satisfied rule returns null, not a message', () => {
  const validators = makeValidators(RULES);
  eq(validators[2].check({ password: 'hunter22!' }), null);
});

test('no rules means no validators and nothing to report', () => {
  eq(makeValidators([]), []);
  eq(validate({ username: '' }, makeValidators([])), []);
});
