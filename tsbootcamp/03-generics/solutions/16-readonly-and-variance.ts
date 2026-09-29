// ─────────────────────────────────────────────────────────────────────────
//  16 · readonly arrays & variance — SOLUTION             ★★★ stretch
//  run: node ../run.js solutions/16-readonly-and-variance.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: variance is one question — "if B fits where A is wanted,
//  where does a CONTAINER of B fit?" — and TypeScript answers it three
//  ways.
//
//  Arrays are covariant: `Dog[]` is accepted as `Animal[]`, which is
//  convenient and unsound, because through the Animal[] alias anyone may
//  push a cat into your dog array. `readonly Animal[]` is the honest
//  version: it accepts the `Dog[]` and takes away the mutators, so
//  nothing can be smuggled in. That is why `readonly T[]` belongs on
//  every parameter you only read — it accepts strictly MORE callers
//  (`T[]` is assignable to `readonly T[]`, never the reverse) while
//  promising strictly LESS.
//
//  Function parameters are contravariant under `strictFunctionTypes`: to
//  stand in for a handler of Animals you must accept ANY animal, so a
//  Dog-only comparator is rejected. The exception is method syntax
//  (`compare(a: T, b: T): number`), which stays bivariant for
//  compatibility — that is the entire difference between `Sorter` and
//  `SorterFn`, and it is worth knowing when a "safe" refactor from
//  interface method to arrow property suddenly lights up red.
//
//  `[...items]` is the whole implementation of `copyOf`: same values,
//  fresh mutable array, and the `readonly` is dropped honestly by copying
//  rather than by casting it away.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

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

export function sumAll(nums: readonly number[]): number {
  return nums.reduce((total, n) => total + n, 0);
}

export function firstReadonly<T>(items: readonly T[]): T | undefined {
  return items.length > 0 ? items[0] : undefined;
}

export function copyOf<T>(items: readonly T[]): T[] {
  return [...items];
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
