// ─────────────────────────────────────────────────────────────────────────
//  17 · serialize an error for the wire                     ★★★ stretch
//  concepts: JSON transport · cause chains · depth budgets
//  run: node 17-serialize-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An Error does not survive JSON. `JSON.stringify(new Error('boom'))`
//  is `'{}'` — name, message and cause are all non-enumerable, so the
//  worker that posts a failure to the main thread sends an empty object
//  and the log says "something went wrong". Write the translator.
//
//    serializeError(error, maxDepth = 5) → a plain, JSON-safe object
//
//      serializeError(new Error('boom'))
//          → { name: 'Error', message: 'boom' }
//
//      serializeError(new Error('save failed', { cause: enoent }))
//          → { name: 'Error', message: 'save failed',
//              cause: { name: 'Error', message: 'no such file',
//                       code: 'ENOENT' } }
//
//    · `code` rides along when it is a string or a number, nothing else
//    · the stack NEVER ships — it leaks absolute paths to the client
//    · non-Errors are described, not crashed on: String(value)
//    · maxDepth counts levels of the chain. The last level you keep says
//      `truncated: true` instead of carrying another `cause`
//
//  hint: the depth budget is also your cycle guard — err.cause is
//  allowed to point back at err.

import { test, eq, ok } from '../../_lib/check.js';

export function serializeError(error, maxDepth = 5) {
  throw new Error('TODO');
}

// ── given: an error family with a name of its own ────────────────────────

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a plain error becomes name and message', () => {
  eq(serializeError(new Error('boom')), { name: 'Error', message: 'boom' });
});

test('the stack never ships', () => {
  eq(Object.keys(serializeError(new Error('boom'))).sort(), [
    'message',
    'name',
  ]);
});

test('a subclass name and a code ride along', () => {
  const err = Object.assign(new TimeoutError('timed out'), { code: 504 });
  eq(serializeError(err), {
    name: 'TimeoutError',
    message: 'timed out',
    code: 504,
  });
});

test('the cause chain is serialized recursively', () => {
  const inner = Object.assign(new Error('no such file'), { code: 'ENOENT' });
  eq(serializeError(new Error('save failed', { cause: inner })), {
    name: 'Error',
    message: 'save failed',
    cause: { name: 'Error', message: 'no such file', code: 'ENOENT' },
  });
});

test('the result survives a real JSON round trip', () => {
  const data = serializeError(
    new Error('outer', { cause: new Error('inner') })
  );
  eq(JSON.parse(JSON.stringify(data)), data);
});

test('non-Error values are described instead of crashing', () => {
  eq(serializeError('just a string'), {
    name: 'Error',
    message: 'just a string',
  });
  eq(serializeError(null).message, 'null');
});

test('maxDepth stops the chain and says so', () => {
  const deep = new Error('l1', {
    cause: new Error('l2', { cause: new Error('l3') }),
  });
  const data = serializeError(deep, 2);
  eq(data.cause.message, 'l2');
  eq(data.cause.truncated, true);
  eq(data.cause.cause, undefined);
});

test('a cycle terminates instead of hanging', () => {
  const a = new Error('a');
  const b = new Error('b', { cause: a });
  a.cause = b;
  const data = serializeError(a, 3);
  ok(data.cause.cause.truncated);
});
