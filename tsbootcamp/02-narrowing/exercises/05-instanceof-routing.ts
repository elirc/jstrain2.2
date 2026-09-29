// ─────────────────────────────────────────────────────────────────────────
//  05 · httpStatus                                           ★★☆ core
//  concepts: instanceof narrowing · unknown · class hierarchies
//  run: node ../run.js exercises/05-instanceof-routing.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A `catch` block hands you `unknown` — it could be an Error, a string,
//  or anything at all. `instanceof` is the guard for class-shaped values:
//  it narrows to the class AND to its subclasses.
//
//      httpStatus(new ValidationError('email', 'bad'))  → 422
//      httpStatus(new NotFoundError('u_7'))             → 404
//      httpStatus(new Error('kaboom'))                  → 500
//      httpStatus('kaboom')                             → 520
//
//      toDate(new Date(0))            → the SAME Date object back
//      toDate('2020-01-02T03:04:05Z') → an equivalent Date
//
//  hint: subclasses are also instances of their base, so order matters —
//  the most specific check has to come first.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export class ValidationError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends Error {
  id: string;

  constructor(id: string) {
    super(`no such record: ${id}`);
    this.name = 'NotFoundError';
    this.id = id;
  }
}

export function httpStatus(error: TODO): number {
  throw new Error('TODO');
}

export function toDate(value: TODO): Date {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a validation error is a 422', () => {
  eq(httpStatus(new ValidationError('email', 'bad address')), 422);
});

test('a not-found error is a 404', () => {
  eq(httpStatus(new NotFoundError('u_7')), 404);
});

test('a plain Error is a 500 — subclass checks must come first', () => {
  eq(httpStatus(new Error('kaboom')), 500);
});

test('a thrown non-Error is a 520', () => {
  eq(httpStatus('kaboom'), 520);
  eq(httpStatus(null), 520);
});

test('toDate passes an existing Date straight through', () => {
  const d = new Date(0);
  ok(toDate(d) === d, 'expected the very same Date object');
});

test('toDate parses strings and epoch numbers', () => {
  eq(toDate('2020-01-02T03:04:05.000Z').toISOString(), '2020-01-02T03:04:05.000Z');
  eq(toDate(0).toISOString(), '1970-01-01T00:00:00.000Z');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof httpStatus>[0], unknown>>;
type _r2 = Expect<
  Equal<Parameters<typeof toDate>[0], Date | string | number>
>;

function _typeTests() {
  const error = '' as unknown;

  // @ts-expect-error — unknown has no members until you narrow it
  error.message;

  if (error instanceof ValidationError) {
    const p = probe(error);
    type _v = Expect<Equal<typeof p, ValidationError>>;
    use(p, p.field);
  }

  const value = '' as unknown as Parameters<typeof toDate>[0];

  if (value instanceof Date) {
    const p = probe(value);
    type _date = Expect<Equal<typeof p, Date>>;
    use(p);
  } else {
    const p = probe(value);
    type _raw = Expect<Equal<typeof p, string | number>>;
    use(p);
  }

  // @ts-expect-error — a boolean is not something you can build a Date from
  toDate(true);
}
use(_typeTests);
