// ─────────────────────────────────────────────────────────────────────────
//  03 · unknown in catch — SOLUTION                        ★★☆ core
//  run: node ../run.js solutions/03-unknown-in-catch.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `unknown` in a catch clause is not an obstacle, it is the
//  compiler telling the truth — `throw 'boom'` is legal JS and your code
//  will meet it. The fix is a funnel: exactly one function, `toError`,
//  turns the whole universe of thrown values into an `Error`. After that
//  one call, every downstream signature can say `Error` and mean it.
//
//  `Result<T>` discriminates on a *literal* `ok: true` / `ok: false`. That
//  is why `if (result.ok)` gives you `.value` on one side and `.error` on
//  the other. Write it as `{ ok: boolean; value?: T; error?: Error }` and
//  narrowing dies: `boolean` carries no information, so both properties
//  stay optional forever and every caller writes `!`.
//
//  The subclasses add a field each and set `this.name`, which `describe`
//  then narrows with `instanceof` — a real runtime check the compiler
//  understands, unlike `error.status !== undefined`. `readonly status`
//  costs nothing and stops callers from rewriting the error after it has
//  been thrown.
//
//  Classic wrong turn: `catch (e: any)`. It compiles today and blows up
//  in production the day something throws a string.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

export function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  if (typeof thrown === 'string') return new Error(thrown);
  return new Error(`non-Error thrown: ${String(thrown)}`);
}

export function safeRun<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (thrown) {
    return { ok: false, error: toError(thrown) };
  }
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class ValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function describe(thrown: unknown): string {
  const error = toError(thrown);
  if (error instanceof HttpError) return `http ${error.status}: ${error.message}`;
  if (error instanceof ValidationError) return `invalid ${error.field}: ${error.message}`;
  return `${error.name}: ${error.message}`;
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
