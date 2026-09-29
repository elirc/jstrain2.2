// ─────────────────────────────────────────────────────────────────────────
//  09 · collect all problems — SOLUTION                     ★★★ stretch
//  run: node 09-collect-all-problems.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole trick is that nothing throws until the end.
//  Each rule pushes onto `problems` and keeps going; the single `throw`
//  lives on the last-but-one line. That is why the shape is a list, not
//  a string — a UI can put each message next to its own input.
//  `age` shows the difference between "absent" and "invalid": missing is
//  fine and becomes null, present-but-broken is a problem. Note that
//  '' has to count as absent, or a blank form field becomes an error the
//  user never typed. `age: '36' → accepted as 36` — numeric strings are
//  coerced, because a form field arrives as a string.
//  Classic wrong turn: returning `{ valid: false, errors }` from some
//  paths and throwing from others. Pick one, and make the caller's job
//  identical every time.

import { test, eq, ok } from '../../_lib/check.js';

export function validateUser(input) {
  const raw = input ?? {};
  const problems = [];

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name === '') {
    problems.push({ field: 'name', message: 'name is required' });
  }

  const email = typeof raw.email === 'string' ? raw.email.trim() : '';
  if (email === '') {
    problems.push({ field: 'email', message: 'email is required' });
  } else if (!email.includes('@')) {
    problems.push({ field: 'email', message: 'email must contain @' });
  }

  let age = null;
  const hasAge = raw.age !== undefined && raw.age !== null && raw.age !== '';
  if (hasAge) {
    const parsed = Number(raw.age);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 149) {
      problems.push({ field: 'age', message: 'age must be 0-149' });
    } else {
      age = parsed;
    }
  }

  if (problems.length > 0) throw new ValidationFailed(problems);
  return { name, email, age };
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
