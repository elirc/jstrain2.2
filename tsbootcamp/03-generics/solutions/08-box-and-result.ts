// ─────────────────────────────────────────────────────────────────────────
//  08 · Box & Result — SOLUTION                           ★★☆ core
//  run: node ../run.js solutions/08-box-and-result.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `interface Box<T>` and `type Result<T, E = Error>` are
//  generics on the TYPE side — parameters in, a concrete type out. Use an
//  interface when you are describing an object shape others may extend;
//  use a type alias when you need a union, a tuple or a default, which is
//  exactly what Result is.
//
//  `mapBox<T, U>` is the shape every functor has: take a `Box<T>` and a
//  `T -> U`, give back a `Box<U>`. Two parameters, because the box you
//  get out is not the box you put in.
//
//  `ok<T>(value: T): Result<T, never>` looks strange until you remember
//  `never` is the empty type: it is assignable to everything, so an ok
//  Result slots into `Result<number, string>`, `Result<number, Error>`,
//  anything. Same trick, mirrored, for `err`.
//
//  `isOk` returns `result is { ok: true; value: T }` — a type predicate.
//  Without it the compiler has no idea that checking `.ok` on the outside
//  of the function proves anything on the inside of the caller.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Box<T> {
  value: T;
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function box<T>(value: T): Box<T> {
  return { value };
}

export function mapBox<T, U>(source: Box<T>, fn: (value: T) => U): Box<U> {
  return { value: fn(source.value) };
}

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('box wraps a value', () => {
  eq(box(2), { value: 2 });
});

test('mapBox transforms the contents and re-boxes them', () => {
  eq(mapBox(box(2), (n: number) => `#${n}`), { value: '#2' });
});

test('ok builds the success branch', () => {
  eq(ok(42), { ok: true, value: 42 });
});

test('err builds the failure branch', () => {
  eq(err('boom'), { ok: false, error: 'boom' });
});

test('isOk tells the branches apart', () => {
  eq(isOk(ok(1)), true);
  eq(isOk(err('boom')), false);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Box<number>, { value: number }>>;
type _r2 = Expect<Equal<Result<number>, Result<number, Error>>>;
type _r3 = Expect<
  Equal<
    Result<number, string>,
    { ok: true; value: number } | { ok: false; error: string }
  >
>;

function _typeTests() {
  const stringBox = mapBox(box(2), (n: number) => `#${n}`);
  type _b = Expect<Equal<typeof stringBox, Box<string>>>;
  use(stringBox);

  // never fits anywhere, so ok() and err() slot into any Result
  const r: Result<number, string> = ok(1);
  const e: Result<number, string> = err('boom');
  use(r, e);

  if (isOk(r)) {
    const value: number = r.value;
    use(value);
  } else {
    const reason: string = r.error;
    use(reason);
  }

  // @ts-expect-error — .value exists only on the ok branch, so not before the guard
  r.value;

  // @ts-expect-error — a Box<number> does not hold a string
  const wrong: Box<string> = box(2);
  use(wrong);
}
use(_typeTests);
