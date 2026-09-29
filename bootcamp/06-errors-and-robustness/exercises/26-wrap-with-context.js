// ─────────────────────────────────────────────────────────────────────────
//  26 · context you can actually log                           ★★☆ core
//  concepts: structured context · redaction · no message stomping
//  run: node 26-wrap-with-context.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 05 added context as prose. Prose does not group, filter or
//  alert — and the moment somebody pastes the request body into the
//  message, the access token is in the log file forever. Attach the
//  context as DATA instead, and sanitise it on the way in.
//
//    wrapWithContext(error, operation, params = {}) → a NEW Error
//        .message  `${operation} failed`
//        .cause    the original, untouched (normalized if it is not
//                  an Error)
//        .context  { operation, ...sanitised params }
//
//    sanitising, per param:
//        password / token / secret / apiKey → '[redacted]'
//        a string longer than 40 characters → first 40 + '...'
//        undefined                          → dropped entirely
//        an object or an array              → '[object]'
//        anything else                      → kept as-is
//
//    contextOf(error) → every .context in the cause chain, outermost
//        first. Two wraps → two entries, and you can read the request
//        top-down without opening a single stack trace.
//
//  hint: the original message must survive UNCHANGED at .cause.message
//  — no appending, no 'save failed: ECONNREFUSED'.

import { test, eq, ok } from '../../_lib/check.js';

export function wrapWithContext(error, operation, params = {}) {
  throw new Error('TODO');
}

export function contextOf(error) {
  throw new Error('TODO');
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
