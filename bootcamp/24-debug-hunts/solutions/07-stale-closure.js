// ─────────────────────────────────────────────────────────────────────────
//  07 · makeValidators — SOLUTION                               ★★☆ core
//  run: node 07-stale-closure.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a closure over a mutated variable. Every check() shares
//  one `rule`, and by the time anybody calls them it holds the last one.
//
//  The tell: `var rule = rules[i]` inside a loop whose body also builds a
//  function that reads `rule`. `var` is function-scoped, so there is ONE
//  binding for the whole call and every closure points at it. `field` and
//  `order` are read during the iteration, so they are right — only the
//  values read LATER, inside check(), come back stale. That split is the
//  fingerprint of this bug: the data looks correct, the behaviour does not.
//
//  The fix is one keyword: `const rule = rules[i];`. `const`/`let` are
//  block-scoped, so each iteration gets its own binding and each closure
//  captures its own rule. (`var i` deserves `let i` too — it is not
//  load-bearing here because `i` is only read at build time, but it is
//  the same landmine one edit away.)
//
//  In the wild: `for (var i…) setTimeout(() => log(i))` printing the
//  length N times, and every event handler in a loop firing with the last
//  row's id. Before `let` existed the workaround was an IIFE per
//  iteration — which is just "make a new binding" the long way.

import { test, eq } from '../../_lib/check.js';

const RULES = [
  { field: 'username', min: 3 },
  { field: 'email', min: 6 },
  { field: 'password', min: 8 },
];

export function makeValidators(rules) {
  const validators = [];
  for (var i = 0; i < rules.length; i++) {
    const rule = rules[i];
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
