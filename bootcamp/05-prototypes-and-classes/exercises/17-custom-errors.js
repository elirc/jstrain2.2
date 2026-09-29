// ─────────────────────────────────────────────────────────────────────────
//  17 · custom error classes                               ★★☆ core
//  concepts: extends Error · instanceof · error handling
//  run: node 17-custom-errors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The most common real use of inheritance in JS: your own error types,
//  so callers can catch what they care about instead of parsing strings.
//
//    AppError extends Error       constructor(message, code)
//                                 sets this.code and this.name
//    NotFoundError extends AppError   constructor(what)
//                                 message `${what} not found`, code 404
//    ValidationError extends AppError constructor(field)
//                                 message `invalid ${field}`, code 422,
//                                 and keeps this.field
//    statusFor(err)               err.code for any AppError, else 500
//
//      const e = new NotFoundError('user');
//      e.message         → 'user not found'
//      e.code            → 404
//      e.name            → 'NotFoundError'
//      e instanceof AppError   → true
//      statusFor(e)            → 404
//      statusFor(new Error('boom'))  → 500
//
//  hint: super(message) is what gives the error its message and stack —
//  and `this.name = ...` after it, because Error's constructor does not
//  know the subclass name

import { test, eq, ok } from '../../_lib/check.js';

export class AppError extends Error {
  constructor(message, code) {
    throw new Error('TODO');
  }
}

export class NotFoundError extends AppError {
  constructor(what) {
    throw new Error('TODO');
  }
}

export class ValidationError extends AppError {
  constructor(field) {
    throw new Error('TODO');
  }
}

export function statusFor(err) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('AppError carries a message and a code', () => {
  const e = new AppError('something broke', 500);
  eq(e.message, 'something broke');
  eq(e.code, 500);
  eq(e.name, 'AppError');
});

test('NotFoundError builds its own message and code', () => {
  const e = new NotFoundError('user');
  eq(e.message, 'user not found');
  eq(e.code, 404);
  eq(e.name, 'NotFoundError');
});

test('ValidationError keeps the field it complained about', () => {
  const e = new ValidationError('email');
  eq(e.message, 'invalid email');
  eq(e.code, 422);
  eq(e.field, 'email');
});

test('every one of them is an Error all the way up the chain', () => {
  const e = new NotFoundError('user');
  ok(e instanceof NotFoundError);
  ok(e instanceof AppError);
  ok(e instanceof Error);
  ok(typeof e.stack === 'string');
});

test('a sibling type is not a match', () => {
  const e = new ValidationError('email');
  eq(e instanceof NotFoundError, false);
});

test('statusFor maps types to numbers', () => {
  eq(statusFor(new NotFoundError('user')), 404);
  eq(statusFor(new ValidationError('email')), 422);
  eq(statusFor(new AppError('teapot', 418)), 418);
});

test('anything unknown is a 500', () => {
  eq(statusFor(new Error('boom')), 500);
  eq(statusFor(new TypeError('bad')), 500);
});

test('catching by type is the point of all this', () => {
  const caught = [];
  for (const thrown of [
    new NotFoundError('user'),
    new ValidationError('email'),
    new Error('boom'),
  ]) {
    try {
      throw thrown;
    } catch (err) {
      if (err instanceof NotFoundError) caught.push('missing');
      else if (err instanceof AppError) caught.push('app');
      else caught.push('unknown');
    }
  }
  eq(caught, ['missing', 'app', 'unknown']);
});
