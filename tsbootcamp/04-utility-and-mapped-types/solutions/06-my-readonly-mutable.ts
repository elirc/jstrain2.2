// ─────────────────────────────────────────────────────────────────────────
//  06 · MyReadonly and Mutable — SOLUTION                   ★★☆ core
//  run: node ../run.js solutions/06-my-readonly-mutable.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the modifier sits in front of the key, inside the loop —
//  `{ readonly [K in keyof T]: T[K] }`. The subtraction form `-readonly`
//  is the only way to remove it, and there is no built-in `Mutable`, so
//  this four-word type is one you will actually retype from memory.
//
//  Three things people get wrong here:
//
//  1. `readonly` is erased at compile time. It stops YOUR code from
//     writing; it does nothing to a value handed to a JS caller. That is
//     why freezePoint also calls `Object.freeze` — and why the runtime
//     test can assert a TypeError (module code is always strict mode).
//  2. `readonly` is SHALLOW. `MyReadonly<{ inner: { n: number } }>` locks
//     `inner` but not `inner.n`. Deep-freezing needs recursion (and is a
//     module 05/06 problem).
//  3. `Object.freeze(x)` already returns `Readonly<T>`, so the annotation
//     and the runtime agree without a cast. Spread first: freezing the
//     caller's own object would be a nasty surprise.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export interface Point {
  x: number;
  y: number;
}

export function freezePoint(point: Point): MyReadonly<Point> {
  return Object.freeze({ ...point });
}

export function thaw(point: MyReadonly<Point>): Mutable<MyReadonly<Point>> {
  return { ...point };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('freezePoint keeps the coordinates', () => {
  eq(freezePoint({ x: 1, y: 2 }), { x: 1, y: 2 });
});

test('freezePoint freezes at runtime too', () => {
  const frozen = freezePoint({ x: 1, y: 2 }) as Point;
  ok(Object.isFrozen(frozen));
  throws(() => {
    frozen.x = 9;
  });
});

test('freezePoint copies — the caller keeps a writable original', () => {
  const original = { x: 1, y: 2 };
  freezePoint(original);
  ok(!Object.isFrozen(original));
});

test('thaw returns a writable copy', () => {
  const frozen = freezePoint({ x: 1, y: 2 });
  const copy = thaw(frozen);
  copy.x = 9;
  eq(copy, { x: 9, y: 2 });
  ok(!Object.isFrozen(copy));
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    MyReadonly<{ a: string; b?: number }>,
    { readonly a: string; readonly b?: number }
  >
>;
type _t2 = Expect<
  Equal<
    Mutable<{ readonly a: string; readonly b?: number }>,
    { a: string; b?: number }
  >
>;
type _t3 = Expect<Equal<Mutable<MyReadonly<Point>>, Point>>;
type _t4 = Expect<Equal<MyReadonly<Point>, Readonly<Point>>>;
// adding readonly twice is not an error and changes nothing
type _t5 = Expect<Equal<MyReadonly<MyReadonly<Point>>, MyReadonly<Point>>>;

function _typeTests() {
  const frozen = freezePoint({ x: 1, y: 2 });
  const x: number = frozen.x;
  use(x);

  // @ts-expect-error — a frozen point rejects writes at compile time
  frozen.x = 9;

  thaw(frozen).y = 4; // ...and the thawed copy accepts them

  // readonly is SHALLOW: the nested object is still writable
  const nested: MyReadonly<{ inner: { n: number } }> = { inner: { n: 1 } };
  nested.inner.n = 2;

  // @ts-expect-error — but the top-level key itself is locked
  nested.inner = { n: 3 };
}
use(_typeTests);
