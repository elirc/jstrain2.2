// ─────────────────────────────────────────────────────────────────────────
//  07 · signup pipeline — SOLUTION                          ★★☆ core
//  run: node 07-build-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the design rule is "one step, one job, same shape in and
//  out". Each step takes a record and returns a record with something
//  ADDED — never a step that both cleans and decides, because then you can
//  never test the cleaning on its own.
//  Notice that validate does not throw. Errors are data here (an array on
//  the record), which is what lets the pipeline stay a straight line: the
//  formatting step reads `errors` and decides what to render. Throwing
//  would force every caller into try/catch and kill the composition.
//  `filter(Boolean)` after split(/\s+/) handles the empty-name case: an
//  empty string splits to [''], which would otherwise crash `word[0]`.

import { test, eq } from '../../_lib/check.js';

const PLANS = ['free', 'pro', 'team'];

// provided — the pipe you built in exercise 06
const pipe =
  (...fns) =>
  (...args) => {
    if (fns.length === 0) return args[0];
    const [first, ...rest] = fns;
    return rest.reduce((value, fn) => fn(value), first(...args));
  };

const raw = Object.freeze({
  name: '  ada   LOVELACE ',
  email: ' ADA@Example.COM ',
  plan: 'PRO',
});

const titleCase = (text) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export function normalize(raw) {
  return {
    name: titleCase(raw.name),
    email: raw.email.trim().toLowerCase(),
    plan: raw.plan.trim().toLowerCase(),
  };
}

export function validate(user) {
  const errors = [];
  if (user.name === '') errors.push('name is required');
  if (!user.email.includes('@')) errors.push('email is invalid');
  if (!PLANS.includes(user.plan)) errors.push('unknown plan');
  return { ...user, errors };
}

export function format(user) {
  const valid = user.errors.length === 0;
  return {
    ...user,
    valid,
    label: valid ? `${user.name} <${user.email}> (${user.plan})` : null,
  };
}

export const processSignup = pipe(normalize, validate, format);

// ──────────────────────────── tests ──────────────────────────────────────

test('normalize cleans up the name, the email and the plan', () => {
  const user = normalize(raw);
  eq(user.name, 'Ada Lovelace');
  eq(user.email, 'ada@example.com');
  eq(user.plan, 'pro');
});

test('normalize survives an empty name', () => {
  eq(normalize({ name: '   ', email: 'a@b.c', plan: 'free' }).name, '');
});

test('normalize does not mutate the raw record', () => {
  normalize(raw);
  eq(raw.plan, 'PRO');
});

test('validate reports an empty error list for a clean record', () => {
  eq(validate({ name: 'Ada', email: 'a@b.c', plan: 'pro' }).errors, []);
});

test('validate names every problem it finds, in order', () => {
  const bad = validate({ name: '', email: 'nope', plan: 'platinum' });
  eq(bad.errors, ['name is required', 'email is invalid', 'unknown plan']);
});

test('format builds a label for a valid signup', () => {
  const user = format({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    plan: 'pro',
    errors: [],
  });
  eq(user.valid, true);
  eq(user.label, 'Ada Lovelace <ada@example.com> (pro)');
});

test('format leaves the label null when there are errors', () => {
  const user = format({ name: '', email: 'x', plan: 'pro', errors: ['boom'] });
  eq(user.valid, false);
  eq(user.label, null);
});

test('processSignup runs all three steps', () => {
  eq(processSignup(raw), {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    plan: 'pro',
    errors: [],
    valid: true,
    label: 'Ada Lovelace <ada@example.com> (pro)',
  });
});
