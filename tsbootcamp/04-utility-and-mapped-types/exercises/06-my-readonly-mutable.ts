// ─────────────────────────────────────────────────────────────────────────
//  06 · MyReadonly and Mutable                              ★★☆ core
//  concepts: mapped types · the readonly and -readonly modifiers
//  run: node ../run.js exercises/06-my-readonly-mutable.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Same loop, the other modifier. `readonly` in front of the key adds the
//  flag; `-readonly` takes it away. `Mutable` is not in the standard
//  library, which is why every codebase eventually writes it.
//
//      MyReadonly<{ a: string }>            →  { readonly a: string }
//      Mutable<{ readonly a: string }>      →  { a: string }
//
//  freezePoint hands out a point nobody can write to — at compile time via
//  the type AND at runtime via Object.freeze, because `readonly` alone
//  vanishes when the code compiles. thaw goes the other way with a copy.
//
//  hint: modifiers go before the `[K in ...]`, not after the colon

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type MyReadonly<T> = TODO;
export type Mutable<T> = TODO;

export interface Point {
  x: number;
  y: number;
}

export function freezePoint(point: Point): MyReadonly<Point> {
  throw new Error('TODO');
}

export function thaw(point: MyReadonly<Point>): Mutable<MyReadonly<Point>> {
  throw new Error('TODO');
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
