// ─────────────────────────────────────────────────────────────────────────
//  10 · validation engine                                   ★★★ capstone
//  concepts: higher-order functions · recursion · paths · async queues
//  time: 40–50 min · 4 stages · 23 tests
//  run: node 10-validation-engine.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  zod, yup, joi, class-validator, Rails' `validates` — every stack has
//  one, and underneath the fluent API it is a tree of small functions and
//  a recursive walk that remembers where it is. Build it once and you
//  will stop treating validation as boilerplate: it is the layer where
//  untrusted input becomes data you are allowed to trust, and the shape
//  of its output decides whether your form can show five problems at
//  once or dribbles them out one submit at a time.
//
//  STAGES — do them in order, run the file after each one
//    1. rules + the error map .. built-in rules, all errors by field
//    2. nested + arrays ........ recursion, and dotted paths
//    3. context + when() ....... cross-field rules
//    4. async rules ★ .......... queued, one at a time
//
//  THE SPEC
//
//    A rule is a FUNCTION: (value, ctx) => undefined | string | string[].
//    Nothing is a rule "type" — a custom rule and a built-in are the same
//    thing. Every built-in below is a factory returning one:
//
//      const user = define({
//        name: [required(), type('string'), minLength(2)],
//        age:  [type('number'), range(18, 130)],
//      });
//      user.validate({ name: 'Ada', age: 36 })
//        → { valid: true, errors: {} }
//      user.validate({ name: '', age: 12 })
//        → { valid: false,
//            errors: { name: ['is required'], age: ['must be at least 18'] } }
//
//    Collect EVERY message a field earns, in rule order. And one rule,
//    one job: only required() has an opinion about a missing value —
//    every other rule returns undefined for undefined, or `{ age: null }`
//    reports three errors for one mistake.
//
//    stage 2 — three kinds of schema node, one recursive walk:
//
//      define({
//        address: { city: [required()] },   // nested → 'address.city'
//        tags:  each([type('string')]),     // per item → 'tags.0'
//        items: each({ qty: [range(1)] }),  // → 'items.0.qty'
//      })
//
//    An absent branch is skipped (no address → no errors about a city).
//    A branch of the wrong shape fails at its OWN path, with
//    'must be an object' / 'must be an array'.
//
//    stage 3 — the second argument every rule receives:
//
//      ctx = { value, field, path, data, root }
//              data = the object this field lives in (its siblings)
//              root = the whole payload · path = 'items.0.qty'
//
//      vatId: [when('kind', (k) => k === 'business', [required()])]
//
//    stage 4 — a rule that has to ask a database:
//
//      const taken = asyncRule(async (value) => …);
//      await form.validateAsync(data)   // same { valid, errors } shape
//      form.validate(data)              // skips async rules entirely
//
//    Async rules run ONE AT A TIME, in schema order — twenty rows must
//    not become twenty simultaneous queries.
//
//  hint (stage 2): pass the path down as you recurse ('' → 'address' →
//  'address.city') instead of trying to rebuild it on the way back up.
//  hint (stage 4): the sync walk cannot await, so it must not CALL an
//  async rule — push a thunk onto a queue and drain the queue with a
//  plain `for … of` + `await` afterwards.

import { test, eq, ok, sleep } from '../../_lib/check.js';

// ── the rule library ─────────────────────────────────────────────────────

// stage 1 — each factory closes over its arguments and returns a rule:
// undefined when the value is fine, a message when it is not.

export const required = (message = 'is required') => (value) => {
  throw new Error('TODO');
};

// type('string') · type('number') · type('boolean')
// → 'must be a string' / 'must be a number' / 'must be a boolean'
export const type = (name) => (value) => {
  throw new Error('TODO');
};

// 'must be at least 3 characters' — and silent about non-strings.
export const minLength = (n) => (value) => {
  throw new Error('TODO');
};

// range(18) · range(18, 65) → 'must be at least 18' / 'must be at most 65'
export const range = (min, max) => (value) => {
  throw new Error('TODO');
};

export const pattern = (re, message = 'has the wrong format') => (value) => {
  throw new Error('TODO');
};

// 'must be one of: free, pro'
export const oneOf = (choices) => (value) => {
  throw new Error('TODO');
};

// stage 2 — a marker node meaning "apply `inner` to every item". It is
// not a rule; the walk has to recognise it. `inner` is a rule list or a
// nested schema.
export const each = (inner) => {
  throw new Error('TODO');
};

// stage 3 — a rule that runs OTHER rules, but only when the sibling
// field satisfies the predicate. It may return several messages.
export const when = (field, predicate, rules) => (value, ctx) => {
  throw new Error('TODO');
};

// stage 4 — mark a rule as one the engine must await instead of calling
// inline. The engine has to be able to see this BEFORE calling it.
export const asyncRule = (fn) => {
  throw new Error('TODO');
};

// ── the engine ───────────────────────────────────────────────────────────

// Returns { validate(data), validateAsync(data) }, both producing
// { valid, errors } where errors maps path → array of messages.
export function define(schema) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: rules and the error map ─────────────────────────────────────

test('a valid object reports valid with an empty error map', () => {
  const user = define({
    name: [required(), type('string'), minLength(2)],
    age: [type('number'), range(18, 130)],
  });
  eq(user.validate({ name: 'Ada', age: 36 }), { valid: true, errors: {} });
});

test('every broken field lands under its own key', () => {
  const user = define({
    name: [required()],
    age: [type('number')],
  });
  eq(user.validate({ name: '', age: 'old' }), {
    valid: false,
    errors: { name: ['is required'], age: ['must be a number'] },
  });
});

test('one field collects every complaint, in rule order', () => {
  const form = define({ zip: [required(), pattern(/^\d{5}$/)] });
  eq(form.validate({ zip: '' }).errors.zip, [
    'is required',
    'has the wrong format',
  ]);
});

test('an absent value passes everything except required', () => {
  const form = define({
    nickname: [type('string'), minLength(3)],
    email: [required()],
  });
  const out = form.validate({});
  eq(out.errors, { email: ['is required'] });
  eq(out.valid, false);
});

test('a string rule stays quiet about a number — one rule, one job', () => {
  const form = define({ handle: [type('string'), minLength(5)] });
  eq(form.validate({ handle: 42 }).errors.handle, ['must be a string']);
});

test('range checks both ends and oneOf lists the choices', () => {
  const form = define({
    age: [range(18, 65)],
    plan: [oneOf(['free', 'pro'])],
  });
  eq(form.validate({ age: 12, plan: 'free' }).errors.age, [
    'must be at least 18',
  ]);
  eq(form.validate({ age: 99, plan: 'free' }).errors.age, [
    'must be at most 65',
  ]);
  eq(form.validate({ age: 30, plan: 'gold' }).errors.plan, [
    'must be one of: free, pro',
  ]);
});

test('fields the schema never mentions are ignored', () => {
  const form = define({ name: [required()] });
  const out = form.validate({ name: 'Ada', isAdmin: true, extra: null });
  eq(out, { valid: true, errors: {} });
});

// ── stage 2: nested schemas and arrays ───────────────────────────────────

test('a nested schema reports dotted paths', () => {
  const form = define({
    name: [required()],
    address: { city: [required()], zip: [pattern(/^\d{5}$/)] },
  });
  const out = form.validate({ name: 'Ada', address: { city: '', zip: 'xx' } });
  eq(out.errors, {
    'address.city': ['is required'],
    'address.zip': ['has the wrong format'],
  });
});

test('a missing branch is skipped, not descended into', () => {
  const form = define({ address: { city: [required()] } });
  eq(form.validate({}), { valid: true, errors: {} });
});

test('a branch that is not an object fails at its own path', () => {
  const form = define({ address: { city: [required()] } });
  eq(form.validate({ address: 'London' }).errors, {
    address: ['must be an object'],
  });
});

test('each() validates every item by index', () => {
  const form = define({ tags: each([type('string'), minLength(2)]) });
  const out = form.validate({ tags: ['ok', 'x', 7] });
  eq(out.errors, {
    'tags.1': ['must be at least 2 characters'],
    'tags.2': ['must be a string'],
  });
});

test('each() with an object schema reaches inside the items', () => {
  const form = define({
    items: each({ sku: [required()], qty: [type('number'), range(1)] }),
  });
  const out = form.validate({
    items: [{ sku: 'a', qty: 2 }, { sku: '', qty: 0 }],
  });
  eq(out.errors, {
    'items.1.sku': ['is required'],
    'items.1.qty': ['must be at least 1'],
  });
});

test('a value declared with each() that is not an array fails', () => {
  const form = define({ tags: each([type('string')]) });
  eq(form.validate({ tags: 'nope' }).errors, { tags: ['must be an array'] });
  eq(form.validate({}), { valid: true, errors: {} });
});

// ── stage 3: custom rules, context and when() ────────────────────────────

test('a custom rule is just a function that returns a message', () => {
  const noSpaces = (value) =>
    typeof value === 'string' && value.includes(' ')
      ? 'cannot contain spaces'
      : undefined;
  const form = define({ handle: [required(), noSpaces] });
  eq(form.validate({ handle: 'ada l' }).errors.handle, [
    'cannot contain spaces',
  ]);
  eq(form.validate({ handle: 'ada' }).valid, true);
});

test('ctx.data gives a rule its siblings', () => {
  const matches = (other) => (value, ctx) =>
    value === ctx.data[other] ? undefined : `must match ${other}`;
  const form = define({
    password: [required()],
    confirm: [required(), matches('password')],
  });
  eq(form.validate({ password: 'hunter2', confirm: 'hunter3' }).errors, {
    confirm: ['must match password'],
  });
  eq(form.validate({ password: 'hunter2', confirm: 'hunter2' }).valid, true);
});

test('ctx tells a rule exactly where it is running', () => {
  const seen = [];
  const probe = (value, ctx) => {
    seen.push([ctx.path, ctx.field, ctx.value, ctx.root.id]);
    return undefined;
  };
  const form = define({ tags: each([probe]) });
  form.validate({ id: 7, tags: ['a', 'b'] });
  eq(seen, [
    ['tags.0', 0, 'a', 7],
    ['tags.1', 1, 'b', 7],
  ]);
});

test('when() runs its rules only if the condition holds', () => {
  const form = define({
    kind: [oneOf(['person', 'business'])],
    vatId: [when('kind', (k) => k === 'business', [required()])],
  });
  eq(form.validate({ kind: 'person' }), { valid: true, errors: {} });
  eq(form.validate({ kind: 'business' }).errors, { vatId: ['is required'] });
  eq(form.validate({ kind: 'business', vatId: 'GB1' }).valid, true);
});

test('when() can contribute several messages at once', () => {
  const form = define({
    kind: [required()],
    vatId: [
      when('kind', (k) => k === 'business', [
        required(),
        pattern(/^GB\d+$/, 'must start with GB'),
      ]),
    ],
  });
  eq(form.validate({ kind: 'business', vatId: '' }).errors.vatId, [
    'is required',
    'must start with GB',
  ]);
});

// ── stage 4: async rules ★ ───────────────────────────────────────────────

// A rule that has to ask a database. The array stands in for the table.
const taken = (rows, ms = 1) =>
  asyncRule(async (value) => {
    await sleep(ms);
    return rows.includes(value) ? 'is already taken' : undefined;
  });

test('validateAsync returns the same shape as validate', async () => {
  const form = define({ email: [required(), taken(['ada@x'])] });
  eq(await form.validateAsync({ email: 'grace@x' }), {
    valid: true,
    errors: {},
  });
  eq(await form.validateAsync({ email: 'ada@x' }), {
    valid: false,
    errors: { email: ['is already taken'] },
  });
});

test('async messages join the sync ones under the same key', async () => {
  const form = define({ email: [minLength(20), taken(['ada@x'])] });
  const out = await form.validateAsync({ email: 'ada@x' });
  eq(out.errors.email, [
    'must be at least 20 characters',
    'is already taken',
  ]);
});

test('async rules run one at a time, in schema order', async () => {
  const trace = [];
  const slow = (name, ms) =>
    asyncRule(async () => {
      trace.push(`start:${name}`);
      await sleep(ms);
      trace.push(`end:${name}`);
      return undefined;
    });
  const form = define({ a: [slow('a', 12)], b: [slow('b', 1)] });
  await form.validateAsync({ a: 1, b: 2 });
  eq(trace, ['start:a', 'end:a', 'start:b', 'end:b']);
});

test('the sync validate() skips async rules entirely', () => {
  let called = 0;
  const counter = asyncRule(async () => {
    called += 1;
    return 'nope';
  });
  const form = define({ email: [required(), counter] });
  const out = form.validate({ email: 'ada@x' });
  eq(out, { valid: true, errors: {} });
  eq(called, 0, 'a sync caller must not fire off queries it cannot await');
});

test('async rules get the same ctx as sync ones', async () => {
  const seen = [];
  const remote = asyncRule(async (value, ctx) => {
    await sleep(1);
    seen.push([ctx.path, ctx.field, ctx.data.qty]);
    return value === 'bad' ? `${ctx.field} was rejected` : undefined;
  });
  const form = define({ lines: each({ sku: [remote], qty: [type('number')] }) });
  const out = await form.validateAsync({
    lines: [{ sku: 'ok', qty: 1 }, { sku: 'bad', qty: 2 }],
  });
  eq(seen, [
    ['lines.0.sku', 'sku', 1],
    ['lines.1.sku', 'sku', 2],
  ]);
  eq(out.errors, { 'lines.1.sku': ['sku was rejected'] });
  ok(!out.valid);
});
