// ─────────────────────────────────────────────────────────────────────────
//  17 · serialize an error for the wire — SOLUTION          ★★★ stretch
//  run: node 17-serialize-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole job is "copy the parts that matter onto a
//  plain object". `name` and `message` are non-enumerable, which is why
//  spreading (`{ ...err }`) and JSON.stringify both hand you `{}` — you
//  have to name the fields yourself. `code` is copied only when it is a
//  primitive worth logging; the stack is deliberately dropped, because
//  it ships your absolute file paths to whoever reads the response.
//  The recursion carries a budget rather than a visited-set, and that
//  one decision solves two problems at once: it bounds the payload AND
//  it makes a cyclic chain (a.cause = b, b.cause = a) terminate. When
//  the budget runs out we say `truncated: true` instead of silently
//  dropping the rest — a reader can tell "no cause" from "not shown".
//  Classic wrong turn: `JSON.stringify(err)` and wondering where the
//  message went, then "fixing" it with err.toString(), which flattens
//  the whole chain into one lossy string.

import { test, eq, ok } from '../../_lib/check.js';

export function serializeError(error, maxDepth = 5) {
  const err = error instanceof Error ? error : new Error(String(error));
  const data = { name: String(err.name), message: String(err.message) };
  if (typeof err.code === 'string' || typeof err.code === 'number') {
    data.code = err.code;
  }
  if (err.cause !== undefined) {
    if (maxDepth <= 1) data.truncated = true;
    else data.cause = serializeError(err.cause, maxDepth - 1);
  }
  return data;
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
