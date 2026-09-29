// ─────────────────────────────────────────────────────────────────────────
//  10 · validation engine — SOLUTION                        ★★★ capstone
//  concepts: higher-order functions · recursion · paths · async queues
//  time: 40–50 min · 4 stages · 23 tests
//  run: node 10-validation-engine.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Two ideas carry the whole file.
//
//  (1) A rule is a FUNCTION: `(value, ctx) => undefined | string |
//  string[]`. Nothing else. There is no Rule class, no registry, no
//  `type: 'minLength'` discriminator to switch on — which is why a
//  user-written rule is indistinguishable from a built-in one, and why
//  `when()` can wrap a list of rules and still be a rule itself. Every
//  built-in below is a factory that closes over its arguments and hands
//  back that one-line function.
//
//  (2) The schema is a TREE and validate() is a recursive walk carrying
//  a path string. Three node kinds, dispatched in `walk`:
//      Array         → a list of rules for this value
//      each(inner)   → apply `inner` to every item
//      plain object  → a nested schema, recurse per key
//  The path is the accumulator: '' → 'address' → 'address.city', and
//  'items' → 'items.0' → 'items.0.qty'. That is the entire reason the
//  error map can be flat — a flat map keyed by path is what a form
//  renderer wants (`errors['items.0.qty']`), and building it costs
//  nothing if you pass the path down instead of trying to reconstruct it
//  on the way back up.
//
//  Stage 1 — rules and the error map. The rule that makes everything
//  else work: ONE RULE, ONE JOB. `minLength` returns early for anything
//  that is not a string; `required` is the only rule that has an opinion
//  about absence. Break that and `{ age: undefined }` reports "is
//  required" AND "must be a number" AND "must be at least 18" for a
//  single missing field. Collecting ALL errors (rather than stopping at
//  the first) is the same instinct: a form that reveals one problem per
//  submit is a form people abandon.
//
//  Stage 2 — recursion. Note what is NOT here: no special case for
//  "array of objects". `each({...})` works because its inner node goes
//  back through the same three-way dispatch, so arrays of objects of
//  arrays fall out for free. Absent branches are skipped rather than
//  descended into — otherwise one missing `address` invents five errors
//  about its fields.
//
//  Stage 3 — context. `ctx` is what turns a value validator into a form
//  validator: `ctx.data` is the object this field lives in (siblings),
//  `ctx.root` is the whole payload, `ctx.path`/`ctx.field` say where you
//  are. Cross-field rules — confirm passwords, end after start, "state
//  is required when country is US" — are all sibling lookups, and
//  `when()` is just the sibling lookup extracted into a wrapper.
//
//  Stage 4 — async ★. Async rules are DECLARED (`asyncRule(fn)` sets a
//  flag) rather than detected by sniffing for a thenable, because by the
//  time you can sniff the result you have already called the function —
//  and the whole point is to not fire twenty "is this email taken"
//  queries at once. The sync pass skips flagged rules and pushes a thunk
//  onto a queue; the async pass awaits the thunks one at a time. A plain
//  `for … of` with `await` inside IS the queue; reach for `Promise.all`
//  here and you have rebuilt the stampede you were avoiding.
//
//  Classic wrong turn: `errors[path] = message` instead of pushing onto
//  an array. It reads fine in tests with one broken rule per field and
//  silently drops the second message for the rest of the product's life.

import { test, eq, ok, sleep } from '../../_lib/check.js';

// ── the rule library ─────────────────────────────────────────────────────

// A rule returns nothing when the value is fine, a string when it is not,
// or an array of strings when it has several complaints.

export const required = (message = 'is required') => (value) =>
  value === undefined || value === null || value === '' ? message : undefined;

export const type = (name) => (value) =>
  value === undefined || value === null || typeof value === name
    ? undefined
    : `must be a ${name}`;

export const minLength = (n) => (value) => {
  if (typeof value !== 'string') return undefined; // not my job
  return value.length >= n ? undefined : `must be at least ${n} characters`;
};

export const range = (min, max) => (value) => {
  if (typeof value !== 'number') return undefined;
  if (min !== undefined && value < min) return `must be at least ${min}`;
  if (max !== undefined && value > max) return `must be at most ${max}`;
  return undefined;
};

export const pattern = (re, message = 'has the wrong format') => (value) => {
  if (typeof value !== 'string') return undefined;
  return re.test(value) ? undefined : message;
};

export const oneOf = (choices) => (value) => {
  if (value === undefined || value === null) return undefined;
  return choices.includes(value)
    ? undefined
    : `must be one of: ${choices.join(', ')}`;
};

// stage 2 — a marker node: "apply `inner` to every item of this array".
export const each = (inner) => ({ kind: 'each', inner });

// stage 3 — a rule that runs other rules, but only when the sibling
// field satisfies the predicate.
export const when = (field, predicate, rules) => (value, ctx) => {
  if (!predicate(ctx.data?.[field])) return undefined;
  return rules.flatMap((rule) => toList(rule(value, ctx)));
};

// stage 4 — a rule the engine must await instead of calling inline.
export const asyncRule = (fn) => Object.assign(fn, { isAsync: true });

// ── the engine ───────────────────────────────────────────────────────────

export function define(schema) {
  const run = (data, queue) => {
    const errors = {};
    walk(schema, data, '', data, data, errors, queue);
    return errors;
  };
  const result = (errors) => ({
    valid: Object.keys(errors).length === 0,
    errors,
  });

  return {
    // stage 1 — the sync pass. Async rules are queued nowhere and so are
    // simply skipped.
    validate(data) {
      return result(run(data, null));
    },

    // stage 4 — same walk, but async rules land in a queue that is then
    // drained one at a time.
    async validateAsync(data) {
      const queue = [];
      const errors = run(data, queue);
      for (const job of queue) await job();
      return result(errors);
    },
  };
}

// The three-way dispatch. `data` is the object holding `value`; `root`
// is the whole payload; `path` is where we are.
function walk(node, value, path, data, root, errors, queue) {
  if (Array.isArray(node)) {
    runRules(node, value, path, data, root, errors, queue);
    return;
  }

  if (node?.kind === 'each') {
    if (value === undefined || value === null) return;
    if (!Array.isArray(value)) {
      addErrors(errors, path, 'must be an array');
      return;
    }
    value.forEach((item, i) =>
      walk(node.inner, item, join(path, i), value, root, errors, queue)
    );
    return;
  }

  // a nested schema — skip an absent branch, complain about a wrong one
  if (value === undefined || value === null) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    addErrors(errors, path, 'must be an object');
    return;
  }
  for (const [field, child] of Object.entries(node)) {
    walk(child, value[field], join(path, field), value, root, errors, queue);
  }
}

function runRules(rules, value, path, data, root, errors, queue) {
  const field = path.slice(path.lastIndexOf('.') + 1); // -1 → the whole path
  const ctx = {
    value,
    field: Array.isArray(data) ? Number(field) : field,
    path,
    data,
    root,
  };
  for (const rule of rules) {
    if (rule.isAsync) {
      // stage 4 — do NOT call it here; hand the call to the queue.
      queue?.push(async () => addErrors(errors, path, await rule(value, ctx)));
      continue;
    }
    addErrors(errors, path, rule(value, ctx));
  }
}

const join = (path, key) => (path === '' ? String(key) : `${path}.${key}`);

const toList = (out) =>
  out === undefined || out === null ? [] : Array.isArray(out) ? out : [out];

function addErrors(errors, path, out) {
  const messages = toList(out);
  if (messages.length === 0) return;
  (errors[path] ??= []).push(...messages);
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
