// ─────────────────────────────────────────────────────────────────────────
//  05 · httpStatus — SOLUTION                                ★★☆ core
//  run: node ../run.js solutions/05-instanceof-routing.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `instanceof` walks the prototype chain, so a
//  ValidationError is ALSO an Error. Put `error instanceof Error` first
//  and it swallows every subclass — the 422 and 404 branches become
//  unreachable at runtime while the compiler stays perfectly happy.
//  Ordering specific-before-general is a runtime concern the type system
//  will not catch for you. (Exercise 09 shows how `never` can.)
//
//  Typing the parameter `unknown` rather than `Error` is deliberate:
//  `catch (e)` gives you `unknown` under strict mode, and a JS library
//  really can throw a string. The final `return 520` is the branch that
//  handles "not an Error at all" — with `unknown` the compiler makes you
//  write it.
//
//  `toDate` is the same guard used for normalisation: after the Date
//  check the remaining type is `string | number`, which is exactly the
//  set of things the `Date` constructor accepts.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

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

export function httpStatus(error: unknown): number {
  if (error instanceof ValidationError) return 422;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof Error) return 500;
  return 520;
}

export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
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
