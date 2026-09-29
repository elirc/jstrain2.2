// ─────────────────────────────────────────────────────────────────────────
//  09 · collect all problems                                ★★★ stretch
//  concepts: aggregate validation · fail-slow · error payloads
//  run: node 09-collect-all-problems.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Fail-fast is right for invariants and wrong for forms. Throwing on the
//  first bad field makes a user fix one thing, resubmit, and discover the
//  next one. Check everything, then report everything at once.
//
//  validateUser(input) returns a cleaned user, or throws ValidationFailed
//  (given below) carrying a `problems` array — one entry per broken rule,
//  in field order: name, email, age.
//
//    rules   name  required, trimmed, must not be blank
//            email required, trimmed, must contain '@'
//            age   OPTIONAL — if present, a whole number 0-149
//
//      validateUser({ name: ' Ada ', email: 'ada@lovelace.dev' })
//          → { name: 'Ada', email: 'ada@lovelace.dev', age: null }
//
//      age: '36' → accepted as 36 (numeric strings are coerced)
//
//      validateUser({ name: ' ', email: 'nope', age: 999 })
//          → throws, .problems = [
//              { field: 'name',  message: 'name is required' },
//              { field: 'email', message: 'email must contain @' },
//              { field: 'age',   message: 'age must be 0-149' } ]
//
//  hint: build the list first and decide whether to throw at the very
//  end — one pass, no early returns.

import { test, eq, ok } from '../../_lib/check.js';

export function validateUser(input) {
  throw new Error('TODO');
}

// ── given: the aggregate error type ──────────────────────────────────────

export class ValidationFailed extends Error {
  constructor(problems) {
    super(`invalid user: ${problems.map((p) => p.field).join(', ')}`);
    this.name = 'ValidationFailed';
    this.problems = problems;
  }
}

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a cleaned user when everything is valid', () => {
  const input = { name: '  Ada ', email: ' ada@lovelace.dev ', age: '36' };
  eq(validateUser(input), {
    name: 'Ada',
    email: 'ada@lovelace.dev',
    age: 36,
  });
});

test('age is optional and comes back as null when absent', () => {
  eq(validateUser({ name: 'Ada', email: 'ada@lovelace.dev' }), {
    name: 'Ada',
    email: 'ada@lovelace.dev',
    age: null,
  });
});

test('reports every problem, not just the first', () => {
  const messy = { name: ' ', email: 'nope', age: 999 };
  const err = thrownBy(() => validateUser(messy));
  eq(err.problems.length, 3);
});

test('each problem names its field and says why', () => {
  const messy = { name: ' ', email: 'nope', age: 999 };
  const err = thrownBy(() => validateUser(messy));
  eq(err.problems[0], { field: 'name', message: 'name is required' });
  eq(err.problems[1], { field: 'email', message: 'email must contain @' });
  eq(err.problems[2], { field: 'age', message: 'age must be 0-149' });
});

test('problems arrive in a stable field order', () => {
  const err = thrownBy(() => validateUser({}));
  eq(err.problems.map((p) => p.field), ['name', 'email']);
});

test('the message summarises which fields failed', () => {
  const err = thrownBy(() => validateUser({ name: '', email: '', age: 30 }));
  eq(err.message, 'invalid user: name, email');
});

test('one bad field means exactly one problem', () => {
  const err = thrownBy(() =>
    validateUser({ name: 'Ada', email: 'bad', age: 30 })
  );
  eq(err.problems.length, 1);
  eq(err.problems[0].field, 'email');
});

test('the failure is still a real Error', () => {
  const err = thrownBy(() => validateUser({}));
  ok(err instanceof Error);
  ok(err instanceof ValidationFailed);
});
