// ─────────────────────────────────────────────────────────────────────────
//  17 · custom error classes — SOLUTION                    ★★☆ core
//  run: node 17-custom-errors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `extends Error` works because the Error constructor
//  returns the object `super()` is initialising, message and stack
//  included. Set `this.name` yourself right after — Error has no idea
//  what you called your subclass, and without it every one of these
//  prints as "Error: user not found".
//
//  NotFoundError composes its message from its argument and forwards a
//  fixed code to AppError: subclasses that specialise a parent by
//  supplying constants are the cheapest kind of inheritance there is.
//
//  statusFor is one `instanceof` against the BASE type, which catches
//  every present and future subclass — the payoff for arranging the
//  chain properly. Comparing `err.name === 'NotFoundError'` would work
//  today and break the moment someone renames a class.
//
//  (Pre-ES6 this needed Object.setPrototypeOf gymnastics, and it still
//  does if you transpile classes down to ES5 — a famous source of
//  "instanceof my error returns false" bug reports.)

import { test, eq, ok } from '../../_lib/check.js';

export class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(what) {
    super(`${what} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(field) {
    super(`invalid ${field}`, 422);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function statusFor(err) {
  return err instanceof AppError ? err.code : 500;
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
