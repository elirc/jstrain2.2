// ─────────────────────────────────────────────────────────────────────────
//  03 · wrapInArray                                       ★☆☆ warm-up
//  concepts: inference vs explicit instantiation
//  run: node ../run.js exercises/03-wrap-in-array.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Three tiny helpers that put a T inside a T[]. The interesting one is
//  the last: `emptyArrayOf` has no arguments, so there is nothing to
//  infer from. That is the one case where you MUST write the type
//  argument yourself — `emptyArrayOf<string>()`.
//
//      wrapInArray(1)            → [1]              typed number[]
//      repeat('ab', 3)           → ['ab','ab','ab'] typed string[]
//      emptyArrayOf<string>()    → []               typed string[]
//      emptyArrayOf()            → []               typed unknown[]  ← no info

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function wrapInArray(value: TODO): TODO {
  throw new Error('TODO');
}

export function repeat(value: TODO, times: number): TODO {
  throw new Error('TODO');
}

export function emptyArrayOf(): TODO {
  throw new Error('TODO');
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
