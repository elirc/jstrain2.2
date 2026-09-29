// ─────────────────────────────────────────────────────────────────────────
//  03 · unknown in catch                                   ★★☆ core
//  concepts: unknown · Result unions · custom Error subclasses
//  run: node ../run.js exercises/03-unknown-in-catch.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  JavaScript lets you `throw` anything: a string, a number, a rejected
//  promise carrying a plain object. Since TS 4.4 with `strict`, the catch
//  binding is therefore `unknown`, and `err.message` does not compile.
//  The industry answer is a two-step: normalise first, narrow second.
//
//      toError(new Error('x'))  → that same Error, untouched
//      toError('boom')          → Error('boom')
//      toError(404)             → Error('non-Error thrown: 404')
//
//      safeRun(() => 6 * 7)     → { ok: true, value: 42 }
//      safeRun(() => { throw new HttpError(404, 'gone') })
//                               → { ok: false, error: HttpError }
//
//      describe(new HttpError(404, 'gone'))  → 'http 404: gone'
//      describe('boom')                      → 'Error: boom'
//
//  Build the Result union, the normaliser, the two Error subclasses and
//  `describe`, which narrows with `instanceof`.
//
//  hint: `Result<T>` is a discriminated union on a literal `ok: true` /
//  `ok: false` — not `{ ok: boolean; value?: T }`, which narrows nothing

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Result<T> = TODO;

export function toError(thrown: TODO): TODO {
  throw new Error('TODO');
}

export function safeRun(fn: TODO): TODO {
  throw new Error('TODO');
}

export class HttpError extends Error {
  readonly status: TODO;

  constructor(status: TODO, message: TODO) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class ValidationError extends Error {
  readonly field: TODO;

  constructor(field: TODO, message: TODO) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function describe(thrown: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('safeRun wraps a value that came back cleanly', () => {
  const result = safeRun(() => 6 * 7);
  eq(result.ok, true);
  if (!result.ok) throw new Error('expected the ok branch');
  eq(result.value, 42);
});

test('safeRun turns a thrown Error into the failure branch', () => {
  const result = safeRun((): number => {
    throw new RangeError('too big');
  });
  if (result.ok) throw new Error('expected the failure branch');
  eq(result.error.name, 'RangeError');
  eq(result.error.message, 'too big');
});

test('safeRun normalises a thrown string into a real Error', () => {
  const result = safeRun((): number => {
    throw 'boom';
  });
  if (result.ok) throw new Error('expected the failure branch');
  ok(result.error instanceof Error, 'expected a real Error');
  eq(result.error.message, 'boom');
});

test('toError hands a real Error straight back, untouched', () => {
  const original = new Error('keep me');
  ok(toError(original) === original, 'expected the very same object');
});

test('describe reads the extra field off each Error subclass', () => {
  eq(describe(new HttpError(404, 'gone')), 'http 404: gone');
  eq(describe(new ValidationError('email', 'is required')), 'invalid email: is required');
});

test('describe still copes with values that were never Errors', () => {
  eq(describe('boom'), 'Error: boom');
  eq(describe(404), 'Error: non-Error thrown: 404');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<Result<number>, { ok: true; value: number } | { ok: false; error: Error }>
>;
type _r2 = Expect<Equal<ReturnType<typeof toError>, Error>>;

function _typeTests() {
  const result = safeRun(() => 42);
  if (result.ok) {
    const value: number = result.value;
    use(value);
  } else {
    const message: string = result.error.message;
    use(message);
  }

  // @ts-expect-error — `value` exists only on the ok branch
  safeRun(() => 42).value;

  // @ts-expect-error — status appears only after narrowing to HttpError
  toError('boom').status;

  // @ts-expect-error — an HttpError needs its status before its message
  new HttpError('nope');

  const caught: unknown = null;
  // @ts-expect-error — a caught value is unknown: no property access yet
  caught.message;
  const normalised: Error = toError(caught);
  use(normalised.message);
}
use(_typeTests);
