// ─────────────────────────────────────────────────────────────────────────
//  25 · applicative validation — SOLUTION                    ★★☆ core
//  run: node 25-validate-all.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the move that makes this work is choosing a return type
//  that COMBINES. A check does not return a boolean (booleans only tell you
//  yes/no) and it does not throw (a throw ends the run) — it returns a LIST
//  of problems, empty for "fine". Lists concatenate, so "run every rule and
//  keep every complaint" is `checks.flatMap(...)` and nothing else. That is
//  the whole of applicative validation: an error channel that accumulates
//  rather than short-circuits, which is the opposite of the Either in 24.
//  Compare 06/09: an if-ladder, a mutable `problems` array pushed into from
//  three places, and a throw at the end. Same output — but here each rule
//  is a value you can name, reuse, store in an array, or generate from a
//  config file, and the "run them all" logic exists once.
//  Classic wrong turn: `checks.map(...)` and forgetting to flatten, so the
//  errors come back as a list of lists (including empty ones), and
//  `errors.length === 0` is never true for a form that passed.

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
  return (input) => (predicate(input[field]) ? [] : [{ field, message }]);
}

export function validateAll(...checks) {
  return (input) => {
    const errors = checks.flatMap((rule) => rule(input));
    return errors.length === 0
      ? { ok: true, value: input }
      : { ok: false, errors };
  };
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
