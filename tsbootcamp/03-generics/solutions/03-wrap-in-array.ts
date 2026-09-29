// ─────────────────────────────────────────────────────────────────────────
//  03 · wrapInArray — SOLUTION                            ★☆☆ warm-up
//  run: node ../run.js solutions/03-wrap-in-array.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: inference reads the ARGUMENTS. `wrapInArray(1)` sees a
//  number in a `value: T` slot, so T is number and the result is
//  `number[]`. Nothing about the call site changes — you never write
//  `wrapInArray<number>(1)`; that is noise the compiler already knows.
//
//  `emptyArrayOf<T>(): T[]` is the exception that proves the rule. There
//  is no argument, so there is no inference candidate, and an
//  uninferrable type parameter falls back to its constraint — `unknown`
//  when there is none. Explicit instantiation is not optional there.
//
//  `Array.from({ length: times }, () => value)` beats a for-loop here and
//  keeps the return type honest without a cast.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function wrapInArray<T>(value: T): T[] {
  return [value];
}

export function repeat<T>(value: T, times: number): T[] {
  return Array.from({ length: times }, () => value);
}

export function emptyArrayOf<T>(): T[] {
  return [];
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('wraps a single value', () => {
  eq(wrapInArray(1), [1]);
});

test('wraps an array without flattening it', () => {
  eq(wrapInArray([1, 2]), [[1, 2]]);
});

test('repeat copies the value n times', () => {
  eq(repeat('ab', 3), ['ab', 'ab', 'ab']);
});

test('repeat with 0 gives an empty array', () => {
  eq(repeat('ab', 0), []);
});

test('emptyArrayOf starts empty', () => {
  eq(emptyArrayOf(), []);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof wrapInArray<string>>, string[]>>;
type _r2 = Expect<Equal<ReturnType<typeof repeat<boolean>>, boolean[]>>;
type _r3 = Expect<Equal<ReturnType<typeof emptyArrayOf<Date>>, Date[]>>;

function _typeTests() {
  const nested = wrapInArray([1, 2]);
  type _n = Expect<Equal<typeof nested, number[][]>>;
  use(nested);

  const nums = emptyArrayOf<number>();
  nums.push(1);
  // @ts-expect-error — this array is number[]; a string does not belong
  nums.push('one');

  // with no argument and no type argument, T has nothing to go on
  const guessed = emptyArrayOf();
  type _g = Expect<Equal<typeof guessed, unknown[]>>;
  use(guessed);

  // @ts-expect-error — times is a number, not a string
  repeat('ab', '3');
}
use(_typeTests);
