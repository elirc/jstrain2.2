// ─────────────────────────────────────────────────────────────────────────
//  01 · throw and catch — SOLUTION                         ★☆☆ warm-up
//  run: node 01-throw-and-catch.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `catch (err)` binds whatever was thrown — there is no
//  guarantee it is an Error, so the first thing any catch block does is
//  ask `err instanceof Error`. Only Errors carry `.name`, `.message` and
//  a stack; a thrown string carries nothing, which is exactly why a stack
//  trace goes missing at 3am.
//  toError is the standard fix at a boundary: normalize first, then the
//  rest of your code can assume it is holding a real Error.
//  Classic wrong turn: `typeof err === 'object'` — true for null, false
//  for a thrown string, and useless either way.

import { test, eq, ok } from '../../_lib/check.js';

export function describeThrow(fn) {
  try {
    fn();
    return 'ok';
  } catch (err) {
    if (err instanceof Error) return `${err.name}: ${err.message}`;
    return `non-error: ${typeof err}`;
  }
}

export function toError(value) {
  return value instanceof Error ? value : new Error(String(value));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reports ok when the function returns normally', () => {
  eq(describeThrow(() => 42), 'ok');
});

test('reports the name and message of a thrown Error', () => {
  eq(
    describeThrow(() => {
      throw new TypeError('bad input');
    }),
    'TypeError: bad input'
  );
});

test('reports the type when a string is thrown', () => {
  eq(
    describeThrow(() => {
      throw 'boom';
    }),
    'non-error: string'
  );
});

test('a thrown object is still just a value', () => {
  eq(
    describeThrow(() => {
      throw { code: 500 };
    }),
    'non-error: object'
  );
});

test('toError passes real Errors through untouched', () => {
  const original = new RangeError('out of range');
  ok(toError(original) === original);
});

test('toError wraps a thrown string in a real Error', () => {
  const wrapped = toError('boom');
  ok(wrapped instanceof Error);
  eq(wrapped.message, 'boom');
});

test('toError stringifies anything else', () => {
  eq(toError(404).message, '404');
});
