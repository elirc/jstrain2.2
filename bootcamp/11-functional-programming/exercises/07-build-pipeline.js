// ─────────────────────────────────────────────────────────────────────────
//  07 · signup pipeline                                     ★★☆ core
//  concepts: composition · pure steps · data pipelines
//  run: node 07-build-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A signup form posts messy data. One 60-line handler used to clean it,
//  check it and render it all at once. Split that into three small pure
//  steps and wire them with the `pipe` provided below.
//
//      raw  = { name: '  ada   LOVELACE ', email: ' ADA@Example.COM ',
//               plan: 'PRO' }
//
//      normalize(raw) → { name: 'Ada Lovelace',
//                         email: 'ada@example.com', plan: 'pro' }
//      validate(user) → { ...user, errors: [] }
//      format(user)   → { ...user, valid: true,
//                         label: 'Ada Lovelace <ada@example.com> (pro)' }
//
//  normalize: trim, collapse runs of whitespace, Title Case each word of
//  the name; lowercase + trim email and plan.
//  validate pushes, in this order: 'name is required' (empty name),
//  'email is invalid' (no '@'), 'unknown plan' (not in PLANS).
//  format sets valid = errors.length === 0, and label = null when invalid.
//  processSignup is the three of them piped together.
//
//  hint: `'a  b'.split(/\s+/)` splits on runs of whitespace.

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

export function normalize(raw) {
  throw new Error('TODO');
}

export function validate(user) {
  throw new Error('TODO');
}

export function format(user) {
  throw new Error('TODO');
}

export const processSignup = (raw) => {
  throw new Error('TODO');
};

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
