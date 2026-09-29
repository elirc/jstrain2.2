// ─────────────────────────────────────────────────────────────────────────
//  04 · custom error classes                                  ★★☆ core
//  concepts: Error subclasses · name · instanceof · extra fields
//  run: node 04-custom-error-classes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `throw new Error('not found')` forces every caller to grep the message
//  string to work out what happened. Give failures a type and the data
//  that goes with them, and callers can branch on `instanceof` instead.
//
//  Build two error classes:
//
//    new ValidationError('email', 'must contain @')
//        .name    → 'ValidationError'
//        .message → 'must contain @'
//        .field   → 'email'
//
//    new NotFoundError('user', 42)
//        .name    → 'NotFoundError'
//        .message → 'user 42 not found'
//        .entity  → 'user'      .id → 42
//
//  Both must still be real Errors, with a real stack.
//
//  hint: `super(message)` sets `.message`; nothing sets `.name` for you.

import { test, eq, ok } from '../../_lib/check.js';

export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    throw new Error('TODO');
  }
}

export class NotFoundError extends Error {
  constructor(entity, id) {
    super();
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a ValidationError is a real Error', () => {
  const err = new ValidationError('email', 'must contain @');
  ok(err instanceof Error);
  ok(err instanceof ValidationError);
});

test('its name is the class name, not "Error"', () => {
  eq(new ValidationError('email', 'must contain @').name, 'ValidationError');
});

test('it keeps the message and the field that failed', () => {
  const err = new ValidationError('email', 'must contain @');
  eq(err.message, 'must contain @');
  eq(err.field, 'email');
});

test('a NotFoundError builds its own message', () => {
  eq(new NotFoundError('user', 42).message, 'user 42 not found');
});

test('it keeps entity and id for the caller to use', () => {
  const err = new NotFoundError('order', 'A-7');
  eq(err.name, 'NotFoundError');
  eq(err.entity, 'order');
  eq(err.id, 'A-7');
});

test('the two kinds can be told apart', () => {
  const missing = new NotFoundError('user', 42);
  ok(missing instanceof NotFoundError);
  ok(!(missing instanceof ValidationError));
});

test('it carries a stack trace', () => {
  const err = new NotFoundError('user', 42);
  ok(typeof err.stack === 'string');
  ok(err.stack.includes('user 42 not found'));
});
