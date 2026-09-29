// ─────────────────────────────────────────────────────────────────────────
//  18 · rebuild an error from the wire                         ★★☆ core
//  concepts: registries · rehydration · untrusted payloads
//  run: node 18-deserialize-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The other half of exercise 17. A payload arrives over a socket and
//  the code that receives it wants to write `catch (err) { if (err
//  instanceof TimeoutError) ... }` — so the flat object has to become a
//  real Error again, without ever letting a name string decide which
//  constructor runs.
//
//    deserializeError(data, registry = {}) → an Error
//
//      registry maps a recorded name to its class:
//          { TimeoutError, NotFoundError }
//
//      a name in the registry → new Registry[name](message)
//      a name that is not     → a plain Error with .name set to it
//      .code and .cause       → restored, all the way down the chain
//
//      deserializeError({ name: 'TimeoutError', message: 'timed out' },
//                       { TimeoutError })      → a real TimeoutError
//
//    Payloads are untrusted, so junk still has to produce an Error:
//      deserializeError('boom')  → Error('boom')
//      deserializeError(null)    → Error('unknown error')
//
//  hint: a lookup table is the whole trick. Never turn a name from the
//  network into a constructor by any other means.

import { test, eq, ok } from '../../_lib/check.js';

export function deserializeError(data, registry = {}) {
  throw new Error('TODO');
}

// ── given: the error family, its registry, and 17's serializer ───────────

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

const registry = { TimeoutError, NotFoundError };

function serializeError(error, maxDepth = 5) {
  const err = error instanceof Error ? error : new Error(String(error));
  const data = { name: String(err.name), message: String(err.message) };
  if (typeof err.code === 'string' || typeof err.code === 'number') {
    data.code = err.code;
  }
  if (err.cause !== undefined && maxDepth > 1) {
    data.cause = serializeError(err.cause, maxDepth - 1);
  }
  return data;
}

// the messages of a chain, outermost first
function chainOf(error) {
  const messages = [];
  for (let err = error; err instanceof Error; err = err.cause) {
    messages.push(err.message);
  }
  return messages;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('name and message come back', () => {
  const err = deserializeError({ name: 'Error', message: 'boom' });
  ok(err instanceof Error);
  eq(err.message, 'boom');
});

test('a registered name comes back as its real class', () => {
  const err = deserializeError(
    { name: 'TimeoutError', message: 'timed out' },
    registry
  );
  ok(err instanceof TimeoutError);
  eq(err.name, 'TimeoutError');
});

test('an unknown name stays a plain Error but keeps the name', () => {
  const data = { name: 'PythonError', message: 'oops' };
  const err = deserializeError(data, registry);
  ok(err instanceof Error);
  ok(!(err instanceof TimeoutError));
  eq(err.name, 'PythonError');
});

test('the code is restored', () => {
  const err = deserializeError({
    name: 'Error',
    message: 'no such file',
    code: 'ENOENT',
  });
  eq(err.code, 'ENOENT');
});

test('the cause chain is rebuilt, deepest last', () => {
  const err = deserializeError({
    name: 'Error',
    message: 'saving failed',
    cause: {
      name: 'Error',
      message: 'db write failed',
      cause: { name: 'Error', message: 'ECONNREFUSED' },
    },
  });
  eq(chainOf(err), ['saving failed', 'db write failed', 'ECONNREFUSED']);
});

test('serialize → JSON → parse → deserialize keeps the whole chain', () => {
  const original = new NotFoundError('user 42 not found');
  const wire = JSON.stringify(
    serializeError(new Error('load profile failed', { cause: original }))
  );
  const err = deserializeError(JSON.parse(wire), registry);
  eq(err.message, 'load profile failed');
  ok(err.cause instanceof NotFoundError);
  eq(err.cause.message, 'user 42 not found');
});

test('junk payloads become an Error instead of throwing', () => {
  eq(deserializeError('boom').message, 'boom');
  eq(deserializeError(null).message, 'unknown error');
  ok(deserializeError(undefined) instanceof Error);
});
