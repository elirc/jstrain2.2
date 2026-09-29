// ─────────────────────────────────────────────────────────────────────────
//  11 · makeValidator — SOLUTION                            ★★☆ core
//  run: node 11-make-validator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two nested loops and a `break`. The break is the design
//  decision — it makes each field report its FIRST failure only, so the
//  order you list checks in becomes a precedence order: cheap structural
//  checks first, semantic checks after. Without it, a string age produces
//  a type error and a nonsense comparison error at the same time.
//  The rules are ordinary data, so nothing stops you writing
//  `makeValidator({ ...baseRules, ...adminRules })` or loading them from
//  JSON — that flexibility is the payoff for not hard-coding the checks
//  inside the function.
//  Errors are RETURNED, never thrown: a validator that throws can only
//  ever tell you about one problem, and forms need all of them at once.

import { test, eq, ok } from '../../_lib/check.js';

const notEmpty = (v) => typeof v === 'string' && v.trim() !== '';
const isNumber = (v) => typeof v === 'number';

const validate = () =>
  makeValidator({
    name: [[notEmpty, 'name is required']],
    age: [
      [isNumber, 'age must be a number'],
      [(v) => v >= 18, 'must be 18 or older'],
    ],
  });

export function makeValidator(rules) {
  return (record) => {
    const errors = [];
    for (const [field, checks] of Object.entries(rules)) {
      for (const [predicate, message] of checks) {
        if (!predicate(record[field], record)) {
          errors.push({ field, message });
          break;
        }
      }
    }
    return errors;
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a record that satisfies every rule has no errors', () => {
  eq(validate()({ name: 'Ada', age: 41 }), []);
});

test('a failing check becomes a { field, message } object', () => {
  eq(validate()({ name: '', age: 41 }), [
    { field: 'name', message: 'name is required' },
  ]);
});

test('every field is checked, in the order the rules were given', () => {
  eq(validate()({ name: '', age: 15 }), [
    { field: 'name', message: 'name is required' },
    { field: 'age', message: 'must be 18 or older' },
  ]);
});

test('only the first failing check of a field is reported', () => {
  eq(validate()({ name: 'Ada', age: 'old' }), [
    { field: 'age', message: 'age must be a number' },
  ]);
});

test('a missing field reaches the predicate as undefined', () => {
  eq(validate()({ name: 'Ada' }), [
    { field: 'age', message: 'age must be a number' },
  ]);
});

test('a predicate can compare against the whole record', () => {
  const check = makeValidator({
    confirm: [[(v, record) => v === record.password, 'passwords must match']],
  });
  eq(check({ password: 'a', confirm: 'a' }), []);
  eq(check({ password: 'a', confirm: 'b' }), [
    { field: 'confirm', message: 'passwords must match' },
  ]);
});

test('a field with no checks can never fail', () => {
  eq(makeValidator({ anything: [] })({ anything: null }), []);
});

test('one validator is reusable across many records', () => {
  const check = validate();
  eq(check({ name: 'Ada', age: 41 }).length, 0);
  eq(check({ name: '', age: 41 }).length, 1);
  ok(typeof check === 'function');
});
