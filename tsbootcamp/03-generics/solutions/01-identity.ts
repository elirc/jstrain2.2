// ─────────────────────────────────────────────────────────────────────────
//  01 · identity — SOLUTION                               ★☆☆ warm-up
//  run: node ../run.js solutions/01-identity.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `<T>` declares a type parameter — a variable that holds a
//  TYPE, filled in fresh at every call site. `identity<T>(value: T): T`
//  links argument and result, so the compiler knows the answer is the
//  same type that went in; `identity(x: any): any` would run identically
//  and teach the compiler nothing.
//
//  `same<T>(a: T, b: T)` uses one parameter twice: TS collects a
//  candidate from each argument and they have to agree, which is why
//  `same(1, 'one')` is a compile error and not a silent `false`.
//
//  Watch the literal: `identity('ready')` is typed `'ready'`, not
//  `string`. When T appears bare in the return type, TS keeps the literal
//  because the caller might care; wrap it (`[T]`, `Box<T>`) and it widens.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function identity<T>(value: T): T {
  return value;
}

export function same<T>(a: T, b: T): boolean {
  return a === b;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('gives back the number it was given', () => {
  eq(identity(5), 5);
});

test('gives back the same object, not a copy', () => {
  const config = { retries: 3 };
  ok(identity(config) === config);
});

test('same() is true for two equal primitives', () => {
  eq(same('a', 'a'), true);
});

test('same() compares by reference, so twins are not the same', () => {
  eq(same({ id: 1 }, { id: 1 }), false);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof identity<string>>, string>>;
type _r2 = Expect<Equal<ReturnType<typeof identity<number[]>>, number[]>>;

function _typeTests() {
  const n: number = identity(5);
  const s: string = identity('hi');
  use(n, s);

  // nobody writes <> at the call site — the argument decides T
  const kept = identity('ready');
  type _k = Expect<Equal<typeof kept, 'ready'>>;
  use(kept);

  // @ts-expect-error — T was pinned to number by hand; a string cannot fit
  identity<number>('nope');

  // @ts-expect-error — both arguments feed the SAME type parameter
  same(1, 'one');

  // @ts-expect-error — same() answers a question, it does not return a value
  const wrong: number = same(1, 2);
  use(wrong);
}
use(_typeTests);
