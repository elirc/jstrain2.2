// ─────────────────────────────────────────────────────────────────────────
//  10 · type predicates — SOLUTION                           ★★☆ core
//  run: node ../run.js solutions/10-type-predicates.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `pet is Fish` is a promise, not a proof. The compiler
//  checks that `Fish` is a plausible narrowing of `Pet` and then TRUSTS
//  the body — write `return 'fly' in pet` by mistake and everything still
//  compiles while every caller is wrong. A guard is the one place where
//  you owe the type system an honest runtime check.
//
//  The payoff is composition. `Array.prototype.filter` has an overload
//  `filter<S extends T>(p: (v: T) => v is S): S[]`, so passing a guard
//  changes the RESULT type: `pets.filter(isFish)` is `Fish[]`. A plain
//  `boolean` return gives you back `Pet[]` and a cast at the call site.
//
//  `isNonEmpty` narrows a shape rather than a member: `T[]` becomes the
//  tuple `[T, ...T[]]`, so index 0 is guaranteed to exist. That is how
//  you turn "I checked `.length > 0`" into something the compiler knows.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export interface Fish {
  name: string;
  swim(): string;
}

export interface Bird {
  name: string;
  fly(): string;
}

export type Pet = Fish | Bird;

const nemo: Fish = { name: 'nemo', swim: () => 'swish' };
const dory: Fish = { name: 'dory', swim: () => 'swish' };
const tweety: Bird = { name: 'tweety', fly: () => 'flap' };
const pets: Pet[] = [nemo, tweety, dory];

export function isFish(pet: Pet): pet is Fish {
  return 'swim' in pet;
}

export function isNonEmpty<T>(values: T[]): values is [T, ...T[]] {
  return values.length > 0;
}

export function fishNames(pets: Pet[]): string[] {
  return pets.filter(isFish).map((fish) => fish.name);
}

export function headOrNull<T>(values: T[]): T | null {
  return isNonEmpty(values) ? values[0] : null;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('isFish tells the two apart', () => {
  ok(isFish(nemo), 'nemo is a fish');
  ok(!isFish(tweety), 'tweety is not a fish');
});

test('filtering with a guard keeps only the fish', () => {
  eq(fishNames(pets), ['nemo', 'dory']);
});

test('isNonEmpty is false for an empty array', () => {
  eq(isNonEmpty([]), false);
});

test('isNonEmpty is true as soon as there is one element', () => {
  eq(isNonEmpty([0]), true);
});

test('headOrNull returns null instead of undefined', () => {
  eq(headOrNull([]), null);
});

test('headOrNull returns the first element when there is one', () => {
  eq(headOrNull(['a', 'b']), 'a');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof isFish>[0], Pet>>;

function _typeTests() {
  const onlyFish = pets.filter(isFish);
  type _filtered = Expect<Equal<typeof onlyFish, Fish[]>>;
  use(onlyFish);

  const pet = pets[0];

  if (isFish(pet)) {
    const p = probe(pet);
    type _fish = Expect<Equal<typeof p, Fish>>;
    use(p, p.swim());
  } else {
    const p = probe(pet);
    type _bird = Expect<Equal<typeof p, Bird>>;
    use(p, p.fly());
  }

  const nums: number[] = [1, 2];

  if (isNonEmpty(nums)) {
    type _tuple = Expect<Equal<typeof nums, [number, ...number[]]>>;
    use(nums);
  }

  // @ts-expect-error — isFish takes a Pet, not any old object
  isFish({ name: 'rock' });
}
use(_typeTests);
