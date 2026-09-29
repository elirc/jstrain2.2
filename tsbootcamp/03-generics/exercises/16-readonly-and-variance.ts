// ─────────────────────────────────────────────────────────────────────────
//  16 · readonly arrays & variance                        ★★★ stretch
//  concepts: readonly T[] · covariance · strictFunctionTypes
//  run: node ../run.js exercises/16-readonly-and-variance.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Three functions to write, and a pile of type probes that teach the
//  rules behind them.
//
//      sumAll([1, 2, 3])          → 6     takes readonly number[]
//      firstReadonly(items)       → the first item, or undefined
//      copyOf(frozen)             → a MUTABLE copy you may push into
//
//  Default to `readonly T[]` on every parameter you do not mutate: a
//  `T[]` is assignable to a `readonly T[]`, never the other way round, so
//  the readonly version accepts strictly more callers and promises less.
//
//  The probes below cover the two directions people get wrong: arrays are
//  covariant (a `Dog[]` passes as an `Animal[]` — convenient and unsound)
//  and function parameters are contravariant, except when they are
//  written in method syntax, which TypeScript deliberately keeps
//  bivariant. `Sorter` and `SorterFn` below differ ONLY in that.
//
//  hint: `readonly T[]` has no push/pop/sort; `[...items]` gets you back
//  to a mutable array

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Animal = { name: string };
export type Dog = { name: string; breed: string };

// same members, different syntax — method vs function property
export interface Sorter<T> {
  compare(a: T, b: T): number;
}
export type SorterFn<T> = {
  compare: (a: T, b: T) => number;
};

// given: a function that really does mutate its argument
export function pushZero(nums: number[]): number[] {
  nums.push(0);
  return nums;
}

export function sumAll(nums: TODO): number {
  throw new Error('TODO');
}

export function firstReadonly(items: TODO): TODO {
  throw new Error('TODO');
}

export function copyOf(items: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('sums a plain array', () => {
  eq(sumAll([1, 2, 3]), 6);
});

test('sums a frozen array too', () => {
  const frozen: readonly number[] = Object.freeze([1, 2]);
  eq(sumAll(frozen), 3);
});

test('firstReadonly reads the first item', () => {
  eq(firstReadonly(['a', 'b']), 'a');
});

test('firstReadonly admits an empty list has nothing', () => {
  eq(firstReadonly([]), undefined);
});

test('copyOf returns a new array, not the original', () => {
  const items: readonly number[] = [1, 2];
  const copy = copyOf(items);
  eq(copy, [1, 2]);
  ok(copy !== items);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof sumAll>[0], readonly number[]>>;
type _r2 = Expect<Equal<ReturnType<typeof firstReadonly<string>>, string | undefined>>;
type _r3 = Expect<Equal<ReturnType<typeof copyOf<string>>, string[]>>;

function _typeTests() {
  const mutable: number[] = [1, 2];
  const frozen: readonly number[] = [1, 2];

  // a mutable array is accepted wherever a readonly one is asked for
  sumAll(mutable);
  sumAll(frozen);

  // @ts-expect-error — the other direction is unsafe: pushZero would mutate it
  pushZero(frozen);

  // @ts-expect-error — readonly arrays simply do not have push
  frozen.push(3);

  const copy = copyOf(frozen);
  copy.push(3);
  use(copy);

  const dogs: Dog[] = [{ name: 'Rex', breed: 'lab' }];

  // arrays are COVARIANT: this is allowed, and it is unsound — the next
  // line puts a non-dog into an array everyone else calls Dog[]
  const animals: Animal[] = dogs;
  animals.push({ name: 'Tom' });

  // the readonly view is the sound version of the same idea
  const safe: readonly Animal[] = dogs;
  use(animals, safe);

  // @ts-expect-error — and nothing turns an Animal[] back into a Dog[]
  const backwards: Dog[] = animals;
  use(backwards);

  const byBreed = (a: Dog, b: Dog): number => a.breed.localeCompare(b.breed);

  // method syntax is BIVARIANT — TS allows this on purpose, unsoundly
  const loose: Sorter<Animal> = { compare: byBreed };
  use(loose);

  // @ts-expect-error — property syntax + strictFunctionTypes = contravariant,
  // so a Dog comparator cannot stand in for an Animal comparator
  const strict: SorterFn<Animal> = { compare: byBreed };
  use(strict);
}
use(_typeTests);
