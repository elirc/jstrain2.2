// ─────────────────────────────────────────────────────────────────────────
//  01 · throw and catch                                    ★☆☆ warm-up
//  concepts: throw · try/catch · non-Error values
//  run: node 01-throw-and-catch.js
// ─────────────────────────────────────────────────────────────────────────
//
//  JavaScript lets you throw ANY value — an Error, a string, an object,
//  even null. Your code should only ever throw Errors, but your code also
//  has to survive libraries that don't.
//
//  Build two tools:
//
//    describeThrow(fn) — run fn, report what came out
//        describeThrow(() => 42)                     → 'ok'
//        describeThrow(() => { throw new TypeError('bad'); })
//                                                    → 'TypeError: bad'
//        describeThrow(() => { throw 'boom'; })      → 'non-error: string'
//        describeThrow(() => { throw { code: 500 }; })
//                                                    → 'non-error: object'
//
//    toError(value) — turn whatever was thrown into a real Error
//        toError(rangeErr)  → that same object, untouched
//        toError('boom')    → new Error('boom')
//        toError(404)       → new Error('404')
//
//  hint: `value instanceof Error` is the only reliable test here.

import { test, eq, ok } from '../../_lib/check.js';

export function describeThrow(fn) {
  throw new Error('TODO');
}

export function toError(value) {
  throw new Error('TODO');
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
