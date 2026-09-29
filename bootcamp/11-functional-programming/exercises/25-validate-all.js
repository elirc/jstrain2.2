// ─────────────────────────────────────────────────────────────────────────
//  25 · applicative validation                               ★★☆ core
//  concepts: fail-slow validation · combinators · rules as functions
//  run: node 25-validate-all.js
// ─────────────────────────────────────────────────────────────────────────
//
//  06/09 collected every problem with a `problems` array, an if-ladder and
//  a throw at the end. Same behaviour, no ladder: make ONE rule a function
//  from input to a list of problems, and "check everything" becomes
//  "concatenate the lists". That is applicative validation — the failures
//  accumulate instead of short-circuiting.
//
//      const check = (field, message, predicate) => (input) => ...
//          → []                              when the predicate holds
//          → [{ field, message }]            when it does not
//
//      const validate = validateAll(
//        check('name', 'name is required', isFilled),
//        check('email', 'email must contain @', hasAt)
//      );
//      validate({ name: 'Ada', email: 'ada@x.dev' })
//        → { ok: true, value: <the input, unchanged> }
//      validate({ name: '', email: 'nope' })
//        → { ok: false, errors: [ {field, message}, {field, message} ] }
//
//  Every check runs, always — two rules on one field report twice, and a
//  failure never stops the checks after it. (Contrast exercise 11, which
//  deliberately reports only the FIRST failing rule per field.)
//
//  hint: flatMap turns "a list of lists of problems" into one list.

import { test, eq, ok, spy } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const isFilled = (v) => typeof v === 'string' && v.trim() !== '';
const hasAt = (v) => typeof v === 'string' && v.includes('@');
const isAdult = (v) => typeof v === 'number' && v >= 18;

const good = deepFreeze({ name: 'Ada', email: 'ada@lovelace.dev', age: 41 });
const bad = deepFreeze({ name: '  ', email: 'nope', age: 12 });

const signupValidator = () =>
  validateAll(
    check('name', 'name is required', isFilled),
    check('email', 'email must contain @', hasAt),
    check('age', 'must be 18 or older', isAdult)
  );

export function check(field, message, predicate) {
  throw new Error('TODO');
}

export function validateAll(...checks) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one check is a function from input to a list of problems', () => {
  const rule = check('name', 'name is required', isFilled);
  eq(rule({ name: 'Ada' }), []);
  eq(rule({ name: '  ' }), [{ field: 'name', message: 'name is required' }]);
});

test('a valid record comes back with ok and the input', () => {
  const result = signupValidator()(good);
  eq(result.ok, true);
  ok(result.value === good, 'the input, not a copy');
});

test('one broken rule gives one error', () => {
  const result = signupValidator()({ ...good, email: 'nope' });
  eq(result, {
    ok: false,
    errors: [{ field: 'email', message: 'email must contain @' }],
  });
});

test('every field is reported, not just the first', () => {
  eq(signupValidator()(bad).errors, [
    { field: 'name', message: 'name is required' },
    { field: 'email', message: 'email must contain @' },
    { field: 'age', message: 'must be 18 or older' },
  ]);
});

test('a failure does not stop the checks that follow it', () => {
  const late = spy(() => true);
  const validate = validateAll(
    check('name', 'name is required', isFilled),
    check('age', 'age is watched', late)
  );
  validate(bad);
  eq(late.callCount, 1, 'it ran despite the earlier failure');
});

test('two rules on the same field both report', () => {
  const validate = validateAll(
    check('email', 'email is required', isFilled),
    check('email', 'email must contain @', hasAt)
  );
  eq(validate({ email: '' }).errors.length, 2);
  eq(validate({ email: 'ada@x.dev' }), { ok: true, value: { email: 'ada@x.dev' } });
});

test('a validator with no checks always succeeds', () => {
  eq(validateAll()(bad), { ok: true, value: bad });
});

test('validating never touches the record', () => {
  signupValidator()(bad);
  eq(bad, { name: '  ', email: 'nope', age: 12 });
});
