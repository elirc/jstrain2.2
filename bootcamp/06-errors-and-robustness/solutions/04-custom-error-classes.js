// ─────────────────────────────────────────────────────────────────────────
//  04 · custom error classes — SOLUTION                       ★★☆ core
//  run: node 04-custom-error-classes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `extends Error` + `super(message)` gives you `.message`
//  and a stack for free. Two things it does NOT give you:
//    - `.name` — it stays 'Error' unless you set it, and `.name` is what
//      shows up in logs and in the first line of the stack;
//    - your data — `field`, `entity`, `id` are yours to attach.
//  Building the message inside the constructor (NotFoundError) means
//  every throw site is one short line and every message reads the same.
//  Classic wrong turn: distinguishing failures by message text
//  (`err.message.includes('not found')`). Types survive rewording.

import { test, eq, ok } from '../../_lib/check.js';

export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends Error {
  constructor(entity, id) {
    super(`${entity} ${id} not found`);
    this.name = 'NotFoundError';
    this.entity = entity;
    this.id = id;
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
