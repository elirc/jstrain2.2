// ─────────────────────────────────────────────────────────────────────────
//  18 · rebuild an error from the wire — SOLUTION              ★★☆ core
//  run: node 18-deserialize-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: rehydration is a lookup, not a construction trick. The
//  registry is an explicit allow-list of classes this process is willing
//  to build; a name that is not in it produces a plain Error with the
//  name recorded as data, so nothing is lost and nothing surprising is
//  instantiated. That is the security shape of the exercise: a name
//  arriving over a socket must never reach `eval`, `Function`, or a
//  global lookup like `globalThis[data.name]`.
//  `Object.hasOwn(registry, data.name)` rather than `registry[name]`
//  guards the inherited-property trap — 'toString' and 'constructor'
//  are truthy on every plain object.
//  The recursion mirrors the serializer exactly, which is the point: a
//  wire format is a pair of functions that agree, and the round-trip
//  test is the only proof that they do.

import { test, eq, ok } from '../../_lib/check.js';

export function deserializeError(data, registry = {}) {
  if (data === null || data === undefined) return new Error('unknown error');
  if (typeof data !== 'object') return new Error(String(data));

  const message = typeof data.message === 'string' ? data.message : '';
  const Registered = Object.hasOwn(registry, data.name)
    ? registry[data.name]
    : null;
  const err = Registered ? new Registered(message) : new Error(message);
  if (!Registered && typeof data.name === 'string' && data.name !== '') {
    err.name = data.name;
  }
  if (data.code !== undefined) err.code = data.code;
  if (data.cause !== undefined) {
    err.cause = deserializeError(data.cause, registry);
  }
  return err;
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
