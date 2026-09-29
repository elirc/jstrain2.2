// ─────────────────────────────────────────────────────────────────────────
//  26 · context you can actually log — SOLUTION                ★★☆ core
//  run: node 26-wrap-with-context.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the message answers "what were we doing", the cause
//  answers "what actually broke", and the context answers "with what
//  inputs" — three questions, three places, none of them fighting for
//  room in one string. Because the message is built only from the
//  operation, the original wording survives verbatim one level down;
//  that is what makes `rootCause(err).message` still comparable and
//  keeps a reworded lower-level error from silently changing the text
//  your alerting greps for.
//  The sanitiser is a small allow-what-you-understand loop. Order
//  matters inside it: check the secret keys FIRST, or a long token gets
//  truncated to forty perfectly usable characters and logged.
//  `value !== null && typeof value === 'object'` is the usual null
//  guard — `typeof null` is 'object', and null is fine to log.
//  Flattening objects to '[object]' keeps the context one level deep
//  and JSON-safe, which is what a log pipeline wants; if you need the
//  nested data, serialize it deliberately, not by accident.
//  Classic wrong turn: `new Error(`${operation} failed: ${err.message}`)`
//  with no cause. The stack of the real failure is gone, the text now
//  contains whatever the lower layer felt like saying, and every layer
//  that repeats the trick adds another copy of it.

import { test, eq, ok } from '../../_lib/check.js';

export function wrapWithContext(error, operation, params = {}) {
  const cause = error instanceof Error ? error : new Error(String(error));
  const context = { operation };
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (SECRET_KEYS.has(key)) context[key] = '[redacted]';
    else if (typeof value === 'string' && value.length > 40) {
      context[key] = `${value.slice(0, 40)}...`;
    } else if (value !== null && typeof value === 'object') {
      context[key] = '[object]';
    } else context[key] = value;
  }
  const wrapped = new Error(`${operation} failed`, { cause });
  wrapped.context = context;
  return wrapped;
}

export function contextOf(error) {
  const contexts = [];
  for (let err = error; err instanceof Error; err = err.cause) {
    if (err.context) contexts.push(err.context);
  }
  return contexts;
}

// ── given: the keys that must never reach a log file ─────────────────────

const SECRET_KEYS = new Set(['password', 'token', 'secret', 'apiKey']);

// ──────────────────────────── tests ──────────────────────────────────────

test('the wrapper names the operation, and keeps the cause', () => {
  const original = new Error('ECONNREFUSED');
  const wrapped = wrapWithContext(original, 'save invoice');
  eq(wrapped.message, 'save invoice failed');
  ok(wrapped.cause === original);
});

test('the original message is never stomped on', () => {
  const wrapped = wrapWithContext(new Error('ECONNREFUSED'), 'save invoice');
  ok(!wrapped.message.includes('ECONNREFUSED'));
  eq(wrapped.cause.message, 'ECONNREFUSED');
});

test('context carries the operation plus the params', () => {
  const wrapped = wrapWithContext(new Error('boom'), 'save invoice', {
    invoiceId: 91,
    attempt: 2,
  });
  eq(wrapped.context, {
    operation: 'save invoice',
    invoiceId: 91,
    attempt: 2,
  });
});

test('secrets are redacted, not logged', () => {
  const wrapped = wrapWithContext(new Error('boom'), 'sign in', {
    email: 'ada@lovelace.dev',
    password: 'hunter2',
    token: 'abc.def.ghi',
  });
  eq(wrapped.context.password, '[redacted]');
  eq(wrapped.context.token, '[redacted]');
  eq(wrapped.context.email, 'ada@lovelace.dev');
});

test('long values are truncated', () => {
  const wrapped = wrapWithContext(new Error('boom'), 'import', {
    body: 'x'.repeat(60),
  });
  eq(wrapped.context.body, `${'x'.repeat(40)}...`);
});

test('undefined params are dropped and objects are flattened', () => {
  const wrapped = wrapWithContext(new Error('boom'), 'import', {
    cursor: undefined,
    user: { id: 1 },
    tags: ['js'],
    dryRun: false,
  });
  eq(wrapped.context, {
    operation: 'import',
    user: '[object]',
    tags: '[object]',
    dryRun: false,
  });
});

test('contextOf walks the whole chain, outermost first', () => {
  const inner = wrapWithContext(new Error('ECONNREFUSED'), 'db write', {
    table: 'invoices',
  });
  const outer = wrapWithContext(inner, 'save invoice', { invoiceId: 91 });
  eq(contextOf(outer), [
    { operation: 'save invoice', invoiceId: 91 },
    { operation: 'db write', table: 'invoices' },
  ]);
});

test('a non-Error original is normalized into one', () => {
  const wrapped = wrapWithContext('just a string', 'save invoice');
  ok(wrapped.cause instanceof Error);
  eq(wrapped.cause.message, 'just a string');
});
