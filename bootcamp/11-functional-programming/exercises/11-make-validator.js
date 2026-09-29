// ─────────────────────────────────────────────────────────────────────────
//  11 · makeValidator                                       ★★☆ core
//  concepts: closures · higher-order functions · rules as data
//  run: node 11-make-validator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same idea as the last exercise, one level up: configure a validator
//  with RULES and get back a reusable `validate(record)` function. Rules
//  are plain data — a map of field name → list of [predicate, message]
//  pairs — so they can be built, merged or shipped from a config file.
//
//      const validate = makeValidator({
//        name: [[(v) => v?.trim() !== '', 'name is required']],
//        age:  [[(v) => typeof v === 'number', 'age must be a number'],
//               [(v) => v >= 18, 'must be 18 or older']],
//      });
//
//      validate({ name: 'Ada', age: 41 })  → []
//      validate({ name: '', age: 15 })
//        → [{ field: 'name', message: 'name is required' },
//           { field: 'age',  message: 'must be 18 or older' }]
//
//  Report at most ONE error per field — the first check that fails, then
//  move on (otherwise 'age must be a number' and 'must be 18 or older'
//  both fire for a string, and the second one is nonsense).
//  Each predicate is called as predicate(value, wholeRecord), so a rule
//  can compare two fields.
//
//  hint: Object.entries(rules) gives you [field, checks] pairs.

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
  throw new Error('TODO');
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
